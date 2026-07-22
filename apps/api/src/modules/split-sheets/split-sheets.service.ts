import crypto from 'crypto';
import { splitSheetsRepository } from './split-sheets.repository';
import { worksRepository } from '../works/works.repository';
import { prisma } from '../../lib/prisma';
import { sendSplitSheetConfirmationEmail } from '../../lib/email';
import { logger } from '../../shared/utils/logger';
import { config } from '../../shared/config/env';
import type { SplitSheetEntry } from '@prisma/client';
import type { CreateSplitSheetInput } from './split-sheets.schema';

export const splitSheetsService = {
  async createSplitSheet(
    userId: string,
    input: CreateSplitSheetInput
  ) {
    // Verify work exists and belongs to user
    const work = await worksRepository.findById(
      input.workId, userId
    );
    if (!work) {
      throw Object.assign(
        new Error('Work not found.'),
        { code: 'WORK_NOT_FOUND', statusCode: 404 }
      );
    }

    // Work must have a certificate before split sheet
    const certificate = await prisma.certificate.findUnique({
      where: { workId: input.workId }
    });

    if (!certificate) {
      throw Object.assign(
        new Error(
          'Work must be certified before adding a split sheet.'
        ),
        { code: 'CERTIFICATE_REQUIRED', statusCode: 422 }
      );
    }

    // Check if split sheet already exists
    const existing = await splitSheetsRepository
      .findByWorkId(input.workId);
    if (existing) {
      throw Object.assign(
        new Error('A split sheet already exists for this work.'),
        { code: 'SPLIT_SHEET_EXISTS', statusCode: 409 }
      );
    }

    // Validate total = 100
    const total = input.entries.reduce(
      (sum, e) => sum + e.percentage, 0
    );
    if (total !== 100) {
      throw Object.assign(
        new Error(
          `Percentages must sum to 100. Current total: ${total}`
        ),
        { code: 'INVALID_PERCENTAGES', statusCode: 400 }
      );
    }

    // Enrich entries with collaborator IDs 
    // (if they're registered HD Verse users)
    const enrichedEntries = await Promise.all(
      input.entries.map(async (entry) => {
        const existingUser = await prisma.user.findUnique({
          where: { email: entry.collaboratorEmail },
          select: { id: true },
        });
        return {
          ...entry,
          collaboratorId: existingUser?.id,
        };
      })
    );

    // Create split sheet
    const splitSheet = await splitSheetsRepository.create({
      workId: input.workId,
      entries: enrichedEntries,
    });

    // Update status to PENDING_CONFIRMATION
    await splitSheetsRepository.updateStatus(
      splitSheet.id, 
      'PENDING_CONFIRMATION'
    );

    // Send confirmation emails to all collaborators
    await Promise.allSettled(
      splitSheet.entries.map(async (entry: SplitSheetEntry) => {
        const confirmUrl = 
          `${config.FRONTEND_URL}/split-sheets/confirm/${entry.confirmationToken}`;
        
        try {
          await sendSplitSheetConfirmationEmail({
            to: entry.collaboratorEmail,
            collaboratorName: entry.collaboratorName,
            uploaderName: work.artistName,
            workTitle: work.title,
            percentage: entry.percentage,
            confirmUrl,
            declineUrl: confirmUrl + '?action=decline',
          });
        } catch (emailError) {
          logger.error(
            { emailError, email: entry.collaboratorEmail },
            'Failed to send split confirmation email'
          );
        }
      })
    );

    logger.info(
      { splitSheetId: splitSheet.id, workId: input.workId },
      'Split sheet created and confirmation emails sent'
    );

    return {
      ...splitSheet,
      status: 'PENDING_CONFIRMATION',
    };
  },

  async confirmSplitEntry(
    token: string,
    action: 'confirm' | 'decline'
  ) {
    const entry = await splitSheetsRepository
      .findEntryByToken(token);

    if (!entry) {
      throw Object.assign(
        new Error('Invalid or expired confirmation link.'),
        { code: 'INVALID_TOKEN', statusCode: 404 }
      );
    }

    const splitSheet = entry.splitSheet;

    // Cannot confirm/decline a locked split sheet
    if (splitSheet.status === 'LOCKED') {
      throw Object.assign(
        new Error('This split sheet is already locked.'),
        { code: 'SPLIT_LOCKED', statusCode: 409 }
      );
    }

    // Cannot re-confirm
    if (entry.confirmationStatus !== 'PENDING') {
      throw Object.assign(
        new Error('You have already responded to this request.'),
        { code: 'ALREADY_RESPONDED', statusCode: 409 }
      );
    }

    const dbAction = action === 'confirm' 
      ? 'CONFIRMED' 
      : 'DECLINED';

    await splitSheetsRepository.confirmEntry(token, dbAction);

    logger.info(
      { 
        token, 
        action: dbAction, 
        splitSheetId: splitSheet.id 
      },
      'Split sheet entry confirmed/declined'
    );

    // If declined — stop here
    // (uploader must resolve and potentially recreate)
    if (action === 'decline') {
      await splitSheetsRepository.updateStatus(splitSheet.id, 'DRAFT'); // revert to draft if declined
      return { 
        confirmed: false, 
        message: 'You have declined this split sheet.' 
      };
    }

    // Check if ALL entries are now confirmed
    const allConfirmed = await splitSheetsRepository
      .checkAllConfirmed(splitSheet.id);

    if (allConfirmed) {
      // Lock the split sheet
      await this.lockSplitSheet(splitSheet.id);
      return { 
        confirmed: true, 
        locked: true,
        message: 'All parties confirmed. Split sheet is now locked.' 
      };
    }

    return { 
      confirmed: true, 
      locked: false,
      message: 'Confirmation received. Waiting for other collaborators.' 
    };
  },

  async lockSplitSheet(splitSheetId: string) {
    const splitSheet = await splitSheetsRepository
      .findById(splitSheetId);
    
    if (!splitSheet) {
      throw new Error(`Split sheet ${splitSheetId} not found`);
    }

    // Generate immutable hash of all confirmed splits
    // Hash includes: workId, all entries (name+email+%), 
    // and timestamp
    const hashPayload = JSON.stringify({
      workId: splitSheet.workId,
      lockedAt: new Date().toISOString(),
      entries: splitSheet.entries
        .sort((a: SplitSheetEntry, b: SplitSheetEntry) => 
          a.collaboratorEmail.localeCompare(b.collaboratorEmail)
        )
        .map((e: SplitSheetEntry) => ({
          name: e.collaboratorName,
          email: e.collaboratorEmail,
          percentage: e.percentage,
          confirmedAt: e.confirmedAt?.toISOString(),
        })),
    });

    const lockedHash = crypto
      .createHash('sha256')
      .update(hashPayload)
      .digest('hex');

    await splitSheetsRepository.lockSplitSheet(
      splitSheetId, 
      lockedHash
    );

    logger.info(
      { splitSheetId, lockedHash },
      'Split sheet locked with immutable hash'
    );

    return { lockedHash };
  },

  async getSplitSheet(workId: string, userId: string) {
    // Verify work ownership
    const work = await worksRepository.findById(workId, userId);
    if (!work) {
      throw Object.assign(
        new Error('Work not found.'),
        { code: 'WORK_NOT_FOUND', statusCode: 404 }
      );
    }

    const splitSheet = await splitSheetsRepository
      .findByWorkId(workId);
    if (!splitSheet) {
      throw Object.assign(
        new Error('No split sheet found for this work.'),
        { code: 'SPLIT_NOT_FOUND', statusCode: 404 }
      );
    }

    return splitSheet;
  },

  // Check if a work is eligible for distribution
  async isEligibleForDistribution(workId: string): 
    Promise<{ eligible: boolean; reason?: string }> {
    const splitSheet = await splitSheetsRepository
      .findByWorkId(workId);

    // No split sheet = sole creator = eligible
    if (!splitSheet) {
      return { eligible: true };
    }

    // Has split sheet but not locked = blocked
    if (splitSheet.status !== 'LOCKED') {
      return {
        eligible: false,
        reason: 'Split sheet must be locked before distribution. All collaborators must confirm their shares.',
      };
    }

    return { eligible: true };
  },
};
