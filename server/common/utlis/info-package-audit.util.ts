import { DatabaseService } from '../../src/database/database.service';

export async function logInfoPackageAudit(
  db: DatabaseService,
  payload: {
    guestId: string;
    actionType: 'PDF_GENERATED' | 'PDF_DOWNLOADED' | 'WHATSAPP_SENT';
    performedBy: string;
    ipAddress?: string;
  },
) {
  const sql = `
    INSERT INTO t_info_package_audit (
      guest_id,
      action_type,
      performed_by,
      performed_at,
      ip_address,
      is_active,
      inserted_at,
      inserted_by,
      inserted_ip
    )
    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, TRUE, CURRENT_TIMESTAMP, $3, $4)
  `;

  await db.query(sql, [
    payload.guestId,
    payload.actionType,
    payload.performedBy,
    payload.ipAddress || null,
  ]);
}