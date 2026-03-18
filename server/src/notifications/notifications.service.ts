import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { ActivityLogService } from 'src/activity-log/activity-log.service';

interface CreateNotificationPayload {
  guestId: string;
  inoutId?: string | null;
  notificationType: string;
  recipientType: string;
  recipientContact: string;
  channel: 'WHATSAPP' | 'SMS' | 'EMAIL';
  message: string;
}

@Injectable()
export class NotificationsService {
    constructor(
        private db: DatabaseService,
        private activityLog: ActivityLogService) {}

    async createNotification(payload: CreateNotificationPayload) {
    return this.db.transaction(async (client) => {

        // 1️⃣ Check if notification already sent
        const history = await client.query(`
        SELECT 1
        FROM notification_history
        WHERE guest_id = $1
            AND notification_type = $2
            AND recipient_contact = $3
            AND channel = $4
        LIMIT 1
        `,[
        payload.guestId,
        payload.notificationType,
        payload.recipientContact,
        payload.channel
        ]);

        if (history.rowCount > 0) {
        return { skipped: true };
        }

        // 2️⃣ Insert notification
        const res = await client.query(`
        INSERT INTO notifications (
            guest_id,
            inout_id,
            notification_type,
            recipient_type,
            recipient_contact,
            channel,
            message,
            status,
            inserted_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,'PENDING',NOW())
        RETURNING notification_id
        `,[
            payload.guestId,
            payload.inoutId ?? null,
            payload.notificationType,
            payload.recipientType,
            payload.recipientContact,
            payload.channel,
            payload.message
        ]);
        await client.query(`
        INSERT INTO notification_history (
            guest_id,
            notification_type,
            inserted_at,
            inserted_by,
            inserted_ip
        )
        VALUES ($1,$2,NOW(),'system','127.0.0.1')
        `,[
        payload.guestId,
        payload.notificationType
        ]);
        // 3️⃣ Log activity
        await this.activityLog.log({
        message: 'Notification queued',
        module: 'NOTIFICATIONS',
        action: 'SENT',
        referenceId: res.rows[0].notification_id,
        performedBy: 'system',
        ipAddress: '127.0.0.1',
        }, client);

        return {
        notificationId: res.rows[0].notification_id,
        queued: true
        };
    });
    }
    async getTemplate(type: string, channel: string) {
    const res = await this.db.query(`
        SELECT template_id, template
        FROM notification_template
        WHERE notification_type = $1
        AND channel = $2
        LIMIT 1
    `,[type,channel]);

    if (!res.rowCount) {
        return null;
    }

    return res.rows[0];
    }
    renderTemplate(template: string, variables: Record<string,string>) {

    let rendered = template;

    for (const key of Object.keys(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        rendered = rendered.replace(regex, variables[key] ?? '');
    }

    return rendered;
    }
    async markNotificationSent(notificationId: string) {
        await this.db.query(`
            UPDATE notifications
            SET status = 'SENT',
                sent_at = NOW(),
                updated_at = NOW()
            WHERE notification_id = $1
            `,[notificationId]);
    }
    async markNotificationFailed(notificationId: string, error: string) {
        await this.db.query(`
        UPDATE notifications
        SET status = 'FAILED',
            retry_count = retry_count + 1,
            error_message = $2,
            updated_at = NOW()
        WHERE notification_id = $1
        `,[notificationId, error]);
    }
}
