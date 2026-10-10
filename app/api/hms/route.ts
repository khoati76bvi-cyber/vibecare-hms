import { env } from "cloudflare:workers";

// This route is the service layer of the demo. Every UI mutation goes through
// one action so the RBAC, state transitions and audit log stay in one place.
type DbRow = Record<string, string | number | boolean | null>;

const DB = () => {
  if (!env.DB) throw new Error("D1 database binding DB is not available");
  return env.DB;
};

const ok = (data: unknown, status = 200) => Response.json({ ok: true, data }, { status });
const fail = (message: string, status = 400) =>
  Response.json({ ok: false, message }, { status });
const now = () => new Date().toISOString();
const id = (prefix: string) => `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;

function dateOffset(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

async function hashPassword(password: string, salt: string) {
  // SHA-256 is used only for this self-contained teaching demo. A production
  // deployment should replace it with Argon2id or bcrypt as specified in the SRS.
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function ensureDemoSeed() {
  const db = DB();
  const count = await db.prepare("SELECT COUNT(*) AS total FROM users").first<{ total: number }>();
  if ((count?.total ?? 0) > 0) return;

  const patientSalt = "hms-patient-demo-salt";
  const doctorSalt = "hms-doctor-demo-salt";
  const auxiliarySalt = "hms-auxiliary-demo-salt";
  const [patientHash, doctorHash, auxiliaryHash] = await Promise.all([
    hashPassword("Patient@123", patientSalt),
    hashPassword("Doctor@123", doctorSalt),
    hashPassword("Patient@123", auxiliarySalt),
  ]);

  const createdAt = now();
  const today = dateOffset(0);
  const tomorrow = dateOffset(1);
  const historyDate = dateOffset(-21);

  // Seed data provides a complete storyline: past consultation, today's queue,
  // future appointment, prescription and invoice for classroom demonstration.
  await db.batch([
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "usr_patient", "patient@hms.vn", patientHash, patientSalt, "PATIENT", "Nguyễn Văn An", "0901234567", createdAt,
    ),
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "usr_doctor", "doctor@hms.vn", doctorHash, doctorSalt, "DOCTOR", "BS. Trần Minh Khoa", "0902222333", createdAt,
    ),
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "usr_patient_2", "lan@hms.vn", auxiliaryHash, auxiliarySalt, "PATIENT", "Lê Hoàng Lan", "0912345678", createdAt,
    ),
    db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "usr_patient_3", "minh@hms.vn", auxiliaryHash, auxiliarySalt, "PATIENT", "Phạm Gia Minh", "0988777666", createdAt,
    ),
    db.prepare("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "pat_001", "usr_patient", "BN001", "DN4010123456789", 65, "1999-06-18", "Nam", "Quận 7, TP. Hồ Chí Minh", "O+", "Nguyễn Thị Mai - 0909988776",
    ),
    db.prepare("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "pat_002", "usr_patient_2", "BN002", "DN4010987654321", 80, "1988-02-11", "Nữ", "TP. Thủ Đức, TP. Hồ Chí Minh", "A+", "Lê Quốc Huy - 0911122233",
    ),
    db.prepare("INSERT INTO patients VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "pat_003", "usr_patient_3", "BN003", null, 0, "2001-11-07", "Nam", "Quận Bình Thạnh, TP. Hồ Chí Minh", "B+", "Phạm Thị Hồng - 0933344455",
    ),
    db.prepare("INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "doc_001", "usr_doctor", "BS001", "BS. Trần Minh Khoa", "Tim mạch", "CKII", "P.203", 350000, "#2563EB", "AVAILABLE",
    ),
    db.prepare("INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "doc_002", null, "BS002", "BS. Nguyễn Thu Hà", "Nội tổng quát", "ThS.BS", "P.105", 280000, "#10B981", "AVAILABLE",
    ),
    db.prepare("INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "doc_003", null, "BS003", "BS. Lê Anh Tuấn", "Da liễu", "CKI", "P.308", 300000, "#F59E0B", "AVAILABLE",
    ),
    db.prepare("INSERT INTO doctors VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "doc_004", null, "BS004", "BS. Vũ Ngọc Mai", "Nhi khoa", "ThS.BS", "P.112", 320000, "#8B5CF6", "AVAILABLE",
    ),
    db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "apt_history", "LH240001", "pat_001", "doc_001", "Tim mạch", historyDate, "09:00", "Tái khám huyết áp", "VERIFIED", 65, 350000, 122500, "PAID", "BANK", "COMPLETED", "A-101", createdAt, createdAt,
    ),
    db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "apt_patient_today", "LH240002", "pat_001", "doc_001", "Tim mạch", today, "15:30", "Đau ngực nhẹ khi vận động", "VERIFIED", 65, 350000, 122500, "AT_HOSPITAL", "AT_HOSPITAL", "CONFIRMED", null, createdAt, createdAt,
    ),
    db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "apt_queue_2", "LH240003", "pat_002", "doc_001", "Tim mạch", today, "08:00", "Theo dõi nhịp tim", "VERIFIED", 80, 350000, 70000, "PAID", "BANK", "CONFIRMED", "A-102", createdAt, createdAt,
    ),
    db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "apt_queue_3", "LH240004", "pat_003", "doc_001", "Tim mạch", today, "09:30", "Khó thở khi vận động", "NOT_PROVIDED", 0, 350000, 350000, "AT_HOSPITAL", "AT_HOSPITAL", "CONFIRMED", "A-103", createdAt, createdAt,
    ),
    db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "apt_upcoming", "LH240005", "pat_001", "doc_002", "Nội tổng quát", tomorrow, "10:00", "Khám sức khỏe định kỳ", "VERIFIED", 65, 280000, 98000, "PENDING", null, "CONFIRMED", null, createdAt, createdAt,
    ),
    db.prepare("INSERT INTO medical_records VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      "rec_001", "pat_001", "doc_001", "apt_history", "Tăng huyết áp độ 1", "Huyết áp 142/90 mmHg. Tiếp tục theo dõi tại nhà và giảm muối.", historyDate,
    ),
    db.prepare("INSERT INTO prescriptions VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "pre_001", "rec_001", "pat_001", "doc_001", "apt_history", "ISSUED", tomorrow, createdAt,
    ),
    db.prepare("INSERT INTO prescription_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "item_001", "pre_001", "Amlodipine 5mg", "1 viên", "1 lần/ngày", 30, "Uống sau ăn sáng", 45000,
    ),
    db.prepare("INSERT INTO prescription_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "item_002", "pre_001", "Omega-3 1000mg", "1 viên", "2 lần/ngày", 30, "Uống sau ăn", 120000,
    ),
    db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "inv_001", "apt_history", "pat_001", 350000, 165000, 227500, 287500, "PAID", "BANK", createdAt,
    ),
    db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "inv_002", "apt_patient_today", "pat_001", 350000, 0, 227500, 122500, "AT_HOSPITAL", "AT_HOSPITAL", null,
    ),
    db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
      "inv_003", "apt_upcoming", "pat_001", 280000, 0, 182000, 98000, "PENDING", null, null,
    ),
    db.prepare("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      "not_001", "usr_patient", "Lịch khám đã được xác nhận", `Bạn có lịch với BS. Trần Minh Khoa lúc 15:30 ngày ${today}, phòng P.203.`, "APPOINTMENT", 0, createdAt,
    ),
    db.prepare("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)").bind(
      "not_002", "usr_patient", "Nhắc uống thuốc", "Amlodipine 5mg: uống 1 viên sau ăn sáng.", "MEDICINE", 0, createdAt,
    ),
  ]);
}

async function getSession(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  return DB().prepare(
    `SELECT u.id, u.email, u.role, u.full_name AS fullName, u.phone
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > ?`,
  ).bind(token, now()).first<DbRow>();
}

async function writeAudit(userId: string, action: string, entityType: string, entityId: string, details: string) {
  await DB().prepare("INSERT INTO audit_logs VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id("audit"), userId, action, entityType, entityId, details, now()).run();
}

async function createNotification(userId: string, title: string, message: string, type: string) {
  await DB().prepare("INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id("not"), userId, title, message, type, 0, now()).run();
}

async function loadRecords(where: string, value: string) {
  const db = DB();
  const records = await db.prepare(
    `SELECT mr.id, mr.appointment_id AS appointmentId, mr.patient_id AS patientId,
            pu.full_name AS patientName, d.full_name AS doctorName, mr.diagnosis,
            mr.notes, mr.visit_date AS visitDate, pr.id AS prescriptionId,
            pr.re_exam_date AS reExamDate, pr.status AS prescriptionStatus
     FROM medical_records mr
     JOIN patients p ON p.id = mr.patient_id
     JOIN users pu ON pu.id = p.user_id
     JOIN doctors d ON d.id = mr.doctor_id
     LEFT JOIN prescriptions pr ON pr.record_id = mr.id
     WHERE ${where} = ? ORDER BY mr.visit_date DESC`,
  ).bind(value).all<DbRow>();

  return Promise.all(records.results.map(async (record) => {
    const items = record.prescriptionId
      ? await db.prepare(
          `SELECT id, medicine_name AS medicineName, dosage, frequency,
                  duration_days AS durationDays, instruction, unit_price AS unitPrice
           FROM prescription_items WHERE prescription_id = ?`,
        ).bind(record.prescriptionId).all<DbRow>()
      : { results: [] as DbRow[] };
    return { ...record, items: items.results };
  }));
}

async function bootstrap(session: DbRow) {
  const db = DB();
  const doctors = await db.prepare(
    `SELECT id, doctor_code AS doctorCode, full_name AS fullName, specialty, degree,
            room, consultation_fee AS consultationFee, avatar_color AS avatarColor,
            available_status AS availableStatus FROM doctors ORDER BY full_name`,
  ).all<DbRow>();

  const baseAppointmentQuery = `
    SELECT a.id, a.appointment_code AS appointmentCode, a.scheduled_date AS scheduledDate,
      a.scheduled_time AS scheduledTime, a.specialty, a.reason,
      a.insurance_status AS insuranceStatus, a.insurance_coverage AS insuranceCoverage,
      a.fee_original AS feeOriginal, a.fee_payable AS feePayable,
      a.payment_status AS paymentStatus, a.payment_method AS paymentMethod,
      a.status, a.queue_token AS queueToken, d.id AS doctorId,
      d.full_name AS doctorName, d.doctor_code AS doctorCode, d.room,
      p.id AS patientId, pu.full_name AS patientName, p.patient_code AS patientCode,
      pu.phone AS patientPhone
    FROM appointments a
    JOIN doctors d ON d.id = a.doctor_id
    JOIN patients p ON p.id = a.patient_id
    JOIN users pu ON pu.id = p.user_id`;

  if (session.role === "PATIENT") {
    const profile = await db.prepare(
      `SELECT p.id, p.patient_code AS patientCode, u.full_name AS fullName, u.phone,
        p.insurance_number AS insuranceNumber, p.insurance_level AS insuranceLevel,
        p.date_of_birth AS dateOfBirth, p.gender, p.address, p.blood_type AS bloodType,
        p.emergency_contact AS emergencyContact
       FROM patients p JOIN users u ON u.id = p.user_id WHERE p.user_id = ?`,
    ).bind(session.id).first<DbRow>();
    if (!profile) throw new Error("Patient profile not found");

    const [appointments, invoices, notifications, records] = await Promise.all([
      db.prepare(`${baseAppointmentQuery} WHERE a.patient_id = ? ORDER BY a.scheduled_date DESC, a.scheduled_time DESC`)
        .bind(profile.id).all<DbRow>(),
      db.prepare(
        `SELECT i.id, i.appointment_id AS appointmentId, a.appointment_code AS appointmentCode,
          i.service_fee AS serviceFee, i.medicine_fee AS medicineFee,
          i.insurance_discount AS insuranceDiscount, i.total, i.status,
          i.payment_method AS paymentMethod, i.paid_at AS paidAt
         FROM invoices i JOIN appointments a ON a.id = i.appointment_id
         WHERE i.patient_id = ? ORDER BY a.scheduled_date DESC`,
      ).bind(profile.id).all<DbRow>(),
      db.prepare(
        `SELECT id, title, message, type, is_read AS isRead, created_at AS createdAt
         FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      ).bind(session.id).all<DbRow>(),
      loadRecords("mr.patient_id", String(profile.id)),
    ]);
    return { user: session, profile, doctors: doctors.results, appointments: appointments.results, records, invoices: invoices.results, notifications: notifications.results };
  }

  const profile = await db.prepare(
    `SELECT id, doctor_code AS doctorCode, full_name AS fullName, specialty, degree,
      room, consultation_fee AS consultationFee, avatar_color AS avatarColor,
      available_status AS availableStatus FROM doctors WHERE user_id = ?`,
  ).bind(session.id).first<DbRow>();
  if (!profile) throw new Error("Doctor profile not found");

  const [appointments, notifications, records] = await Promise.all([
    db.prepare(`${baseAppointmentQuery} WHERE a.doctor_id = ? ORDER BY a.scheduled_date DESC, a.scheduled_time ASC`)
      .bind(profile.id).all<DbRow>(),
    db.prepare(
      `SELECT id, title, message, type, is_read AS isRead, created_at AS createdAt
       FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    ).bind(session.id).all<DbRow>(),
    loadRecords("mr.doctor_id", String(profile.id)),
  ]);
  return { user: session, profile, doctors: doctors.results, appointments: appointments.results, records, invoices: [], notifications: notifications.results };
}

export async function GET(request: Request) {
  try {
    await ensureDemoSeed();
    const session = await getSession(request);
    if (!session) return fail("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
    return ok(await bootstrap(session));
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Không thể tải dữ liệu hệ thống", 500);
  }
}

export async function POST(request: Request) {
  try {
    await ensureDemoSeed();
    const body = await request.json() as Record<string, unknown>;
    const action = String(body.action ?? "");
    const db = DB();

    if (action === "login") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const role = String(body.role ?? "").toUpperCase();
      const user = await db.prepare("SELECT * FROM users WHERE email = ? AND role = ?")
        .bind(email, role).first<DbRow>();
      if (!user) return fail("Email hoặc vai trò đăng nhập không đúng.", 401);
      const candidate = await hashPassword(password, String(user.password_salt));
      if (candidate !== user.password_hash) return fail("Mật khẩu không đúng.", 401);

      const token = crypto.randomUUID() + crypto.randomUUID();
      const expires = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      await db.prepare("INSERT INTO sessions VALUES (?, ?, ?)").bind(token, user.id, expires).run();
      await writeAudit(String(user.id), "LOGIN", "SESSION", token.slice(0, 12), `Role ${role} logged in`);
      return ok({ token, role, fullName: user.full_name });
    }

    const session = await getSession(request);
    if (!session) return fail("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);

    if (action === "logout") {
      const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
      if (token) await db.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
      return ok({ message: "Đã đăng xuất" });
    }

    if (action === "createAppointment") {
      if (session.role !== "PATIENT") return fail("Chỉ bệnh nhân được đặt lịch.", 403);
      const patient = await db.prepare("SELECT * FROM patients WHERE user_id = ?").bind(session.id).first<DbRow>();
      const doctor = await db.prepare("SELECT * FROM doctors WHERE id = ?").bind(String(body.doctorId ?? "")).first<DbRow>();
      if (!patient || !doctor) return fail("Không tìm thấy hồ sơ bệnh nhân hoặc bác sĩ.");

      const scheduledDate = String(body.scheduledDate ?? "");
      const scheduledTime = String(body.scheduledTime ?? "");
      const reason = String(body.reason ?? "").trim();
      if (!scheduledDate || !scheduledTime || reason.length < 5) return fail("Vui lòng nhập đầy đủ ngày, giờ và lý do khám.");
      if (scheduledDate < dateOffset(0)) return fail("Ngày khám không thể nằm trong quá khứ.");

      const occupied = await db.prepare(
        "SELECT id FROM appointments WHERE doctor_id = ? AND scheduled_date = ? AND scheduled_time = ? AND status != 'CANCELLED'",
      ).bind(doctor.id, scheduledDate, scheduledTime).first();
      if (occupied) return fail("Khung giờ này vừa được đặt. Vui lòng chọn giờ khác.", 409);

      const insuranceNumber = String(body.insuranceNumber ?? patient.insurance_number ?? "").toUpperCase();
      const insuranceValid = /^[A-Z]{2}\d{13}$/.test(insuranceNumber);
      const coverage = insuranceValid ? Number(patient.insurance_level || 65) : 0;
      const originalFee = Number(doctor.consultation_fee);
      const payable = Math.round(originalFee * (100 - coverage) / 100);
      const appointmentId = id("apt");
      const code = `LH${Date.now().toString().slice(-8)}`;
      const payChoice = String(body.paymentChoice ?? "AT_HOSPITAL");
      const paymentStatus = payChoice === "ONLINE" ? "PENDING" : "AT_HOSPITAL";
      const timestamp = now();

      await db.batch([
        db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
          appointmentId, code, patient.id, doctor.id, doctor.specialty, scheduledDate, scheduledTime,
          reason, insuranceValid ? "VERIFIED" : "NOT_PROVIDED", coverage, originalFee, payable,
          paymentStatus, payChoice === "AT_HOSPITAL" ? "AT_HOSPITAL" : null, "CONFIRMED", null, timestamp, timestamp,
        ),
        db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
          id("inv"), appointmentId, patient.id, originalFee, 0, originalFee - payable, payable,
          paymentStatus, payChoice === "AT_HOSPITAL" ? "AT_HOSPITAL" : null, null,
        ),
      ]);
      await createNotification(String(session.id), "Đặt lịch thành công", `Mã lịch ${code} với ${doctor.full_name} lúc ${scheduledTime} ngày ${scheduledDate}.`, "APPOINTMENT");
      await writeAudit(String(session.id), "CREATE_APPOINTMENT", "APPOINTMENT", appointmentId, `${doctor.full_name} - ${scheduledDate} ${scheduledTime}`);
      return ok({ appointmentId, appointmentCode: code, insuranceValid, coverage, payable }, 201);
    }

    const appointmentId = String(body.appointmentId ?? "");
    const appointment = appointmentId
      ? await db.prepare(
          `SELECT a.*, p.user_id AS patient_user_id, d.user_id AS doctor_user_id,
                  p.patient_code, d.full_name AS doctor_name, d.room
           FROM appointments a JOIN patients p ON p.id = a.patient_id
           JOIN doctors d ON d.id = a.doctor_id WHERE a.id = ?`,
        ).bind(appointmentId).first<DbRow>()
      : null;

    if (["cancelAppointment", "payAppointment", "checkIn", "startConsultation", "completeConsultation", "doctorEmergency"].includes(action) && !appointment) {
      return fail("Không tìm thấy lịch hẹn.", 404);
    }

    if (action === "cancelAppointment") {
      const allowed = session.id === appointment?.patient_user_id || session.id === appointment?.doctor_user_id;
      if (!allowed) return fail("Bạn không có quyền hủy lịch này.", 403);
      if (["COMPLETED", "CANCELLED", "IN_CONSULTATION"].includes(String(appointment?.status))) return fail("Lịch hẹn không thể hủy ở trạng thái hiện tại.");
      await db.prepare("UPDATE appointments SET status = 'CANCELLED', updated_at = ? WHERE id = ?").bind(now(), appointmentId).run();
      await createNotification(String(appointment?.patient_user_id), "Lịch hẹn đã hủy", `Lịch ${appointment?.appointment_code} đã được hủy.`, "WARNING");
      await writeAudit(String(session.id), "CANCEL_APPOINTMENT", "APPOINTMENT", appointmentId, String(body.reason ?? "User cancelled"));
      return ok({ status: "CANCELLED" });
    }

    if (action === "payAppointment") {
      if (session.id !== appointment?.patient_user_id) return fail("Bạn không có quyền thanh toán lịch này.", 403);
      if (appointment?.payment_status === "PAID") return fail("Lịch hẹn đã được thanh toán.");
      const method = String(body.method ?? "BANK");
      await db.batch([
        db.prepare("UPDATE appointments SET payment_status = 'PAID', payment_method = ?, status = 'CONFIRMED', updated_at = ? WHERE id = ?").bind(method, now(), appointmentId),
        db.prepare("UPDATE invoices SET status = 'PAID', payment_method = ?, paid_at = ? WHERE appointment_id = ?").bind(method, now(), appointmentId),
      ]);
      await createNotification(String(session.id), "Thanh toán thành công", `Giao dịch cho lịch ${appointment?.appointment_code} đã hoàn tất.`, "PAYMENT");
      await writeAudit(String(session.id), "PAY_APPOINTMENT", "INVOICE", appointmentId, `Method ${method}`);
      return ok({ paymentStatus: "PAID" });
    }

    if (action === "checkIn") {
      if (session.id !== appointment?.patient_user_id) return fail("Bạn không có quyền check-in lịch này.", 403);
      if (appointment?.status !== "CONFIRMED") return fail("Chỉ lịch đã xác nhận mới được check-in.");
      if (appointment?.queue_token) return ok({ queueToken: appointment.queue_token });
      // Use MAX instead of COUNT so tokens stay unique even if an earlier token
      // was cancelled or the sequence contains a gap.
      const queueState = await db.prepare("SELECT MAX(CAST(SUBSTR(queue_token, 3) AS INTEGER)) AS maxToken FROM appointments WHERE doctor_id = ? AND scheduled_date = ? AND queue_token IS NOT NULL")
        .bind(appointment?.doctor_id, appointment?.scheduled_date).first<{ maxToken: number | null }>();
      const token = `A-${Math.max(100, Number(queueState?.maxToken ?? 100)) + 1}`;
      await db.prepare("UPDATE appointments SET queue_token = ?, updated_at = ? WHERE id = ?").bind(token, now(), appointmentId).run();
      await createNotification(String(session.id), "Check-in thành công", `Số thứ tự ${token}, vui lòng đến ${appointment?.room}.`, "QUEUE");
      await writeAudit(String(session.id), "CHECK_IN", "APPOINTMENT", appointmentId, token);
      return ok({ queueToken: token });
    }

    if (action === "startConsultation") {
      if (session.role !== "DOCTOR" || session.id !== appointment?.doctor_user_id) return fail("Chỉ bác sĩ phụ trách được bắt đầu khám.", 403);
      if (appointment?.status !== "CONFIRMED") return fail("Lịch hẹn chưa sẵn sàng để khám.");
      await db.prepare("UPDATE appointments SET status = 'IN_CONSULTATION', updated_at = ? WHERE id = ?").bind(now(), appointmentId).run();
      await createNotification(String(appointment?.patient_user_id), "Đến lượt khám", `Bác sĩ đang mời bạn vào ${appointment?.room}.`, "QUEUE");
      await writeAudit(String(session.id), "START_CONSULTATION", "APPOINTMENT", appointmentId, "Status changed to IN_CONSULTATION");
      return ok({ status: "IN_CONSULTATION" });
    }

    if (action === "completeConsultation") {
      if (session.role !== "DOCTOR" || session.id !== appointment?.doctor_user_id) return fail("Chỉ bác sĩ phụ trách được hoàn tất khám.", 403);
      if (appointment?.status !== "IN_CONSULTATION") return fail("Cần bắt đầu buổi khám trước khi hoàn tất.");
      const diagnosis = String(body.diagnosis ?? "").trim();
      const notes = String(body.notes ?? "").trim();
      const medicines = Array.isArray(body.medicines) ? body.medicines as Array<Record<string, unknown>> : [];
      if (diagnosis.length < 3 || notes.length < 3) return fail("Vui lòng nhập chẩn đoán và ghi chú lâm sàng.");
      if (!medicines.length || medicines.some((item) => !String(item.medicineName ?? "").trim())) return fail("Đơn thuốc cần ít nhất một thuốc hợp lệ.");

      const recordId = id("rec");
      const prescriptionId = id("pre");
      const reExamDate = String(body.reExamDate ?? "") || null;
      const medicineFee = medicines.reduce((sum, item) => sum + Number(item.unitPrice ?? 0), 0);
      const timestamp = now();
      const statements = [
        db.prepare("INSERT INTO medical_records VALUES (?, ?, ?, ?, ?, ?, ?)").bind(recordId, appointment.patient_id, appointment.doctor_id, appointmentId, diagnosis, notes, timestamp.slice(0, 10)),
        db.prepare("INSERT INTO prescriptions VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(prescriptionId, recordId, appointment.patient_id, appointment.doctor_id, appointmentId, "ISSUED", reExamDate, timestamp),
        ...medicines.map((item) => db.prepare("INSERT INTO prescription_items VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(
          id("item"), prescriptionId, String(item.medicineName), String(item.dosage), String(item.frequency),
          Number(item.durationDays), String(item.instruction), Number(item.unitPrice),
        )),
        db.prepare("UPDATE appointments SET status = 'COMPLETED', updated_at = ? WHERE id = ?").bind(timestamp, appointmentId),
        db.prepare("UPDATE invoices SET medicine_fee = ?, total = total + ?, status = CASE WHEN status = 'PENDING' THEN 'AT_HOSPITAL' ELSE status END WHERE appointment_id = ?").bind(medicineFee, medicineFee, appointmentId),
      ];

      if (reExamDate) {
        const reExamId = id("apt");
        const code = `TK${Date.now().toString().slice(-8)}`;
        statements.push(
          db.prepare("INSERT INTO appointments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
            reExamId, code, appointment.patient_id, appointment.doctor_id, appointment.specialty, reExamDate, "09:00",
            "Tái khám tự động theo chỉ định bác sĩ", appointment.insurance_status, appointment.insurance_coverage,
            appointment.fee_original, appointment.fee_payable, "AT_HOSPITAL", "AT_HOSPITAL", "CONFIRMED", null, timestamp, timestamp,
          ),
          db.prepare("INSERT INTO invoices VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(
            id("inv"), reExamId, appointment.patient_id, appointment.fee_original, 0,
            Number(appointment.fee_original) - Number(appointment.fee_payable), appointment.fee_payable,
            "AT_HOSPITAL", "AT_HOSPITAL", null,
          ),
        );
      }

      await db.batch(statements);
      await createNotification(String(appointment?.patient_user_id), "Đã hoàn tất khám", `Đơn thuốc và hồ sơ của lịch ${appointment?.appointment_code} đã sẵn sàng.`, "PRESCRIPTION");
      if (reExamDate) await createNotification(String(appointment?.patient_user_id), "Đã tạo lịch tái khám", `Lịch tái khám tự động vào ngày ${reExamDate} lúc 09:00.`, "APPOINTMENT");
      await writeAudit(String(session.id), "COMPLETE_CONSULTATION", "MEDICAL_RECORD", recordId, diagnosis);
      return ok({ status: "COMPLETED", recordId, prescriptionId, reExamDate });
    }

    if (action === "doctorEmergency") {
      if (session.role !== "DOCTOR" || session.id !== appointment?.doctor_user_id) return fail("Chỉ bác sĩ phụ trách được báo bận.", 403);
      if (["COMPLETED", "CANCELLED", "IN_CONSULTATION"].includes(String(appointment?.status))) return fail("Không thể thay đổi lịch ở trạng thái này.");
      const reason = String(body.reason ?? "Lịch công tác đột xuất");
      await db.prepare("UPDATE appointments SET status = 'CANCELLED', updated_at = ? WHERE id = ?").bind(now(), appointmentId).run();
      await createNotification(String(appointment?.patient_user_id), "Cần đặt lại lịch khám", `${appointment?.doctor_name} có ${reason.toLowerCase()}. Lịch ${appointment?.appointment_code} đã được hủy để bạn chọn khung giờ khác.`, "WARNING");
      await writeAudit(String(session.id), "EMERGENCY_OVERRIDE", "APPOINTMENT", appointmentId, reason);
      return ok({ status: "CANCELLED" });
    }

    if (action === "readNotifications") {
      await db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(session.id).run();
      return ok({ read: true });
    }

    return fail("Thao tác không được hỗ trợ.", 404);
  } catch (error) {
    console.error("HMS API error", error);
    return fail(error instanceof Error ? error.message : "Lỗi xử lý dữ liệu", 500);
  }
}
