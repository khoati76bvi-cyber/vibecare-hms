CREATE TABLE `appointments` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_code` text NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`specialty` text NOT NULL,
	`scheduled_date` text NOT NULL,
	`scheduled_time` text NOT NULL,
	`reason` text NOT NULL,
	`insurance_status` text NOT NULL,
	`insurance_coverage` integer DEFAULT 0 NOT NULL,
	`fee_original` integer NOT NULL,
	`fee_payable` integer NOT NULL,
	`payment_status` text NOT NULL,
	`payment_method` text,
	`status` text NOT NULL,
	`queue_token` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `appointments_appointment_code_unique` ON `appointments` (`appointment_code`);--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`details` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `doctors` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`doctor_code` text NOT NULL,
	`full_name` text NOT NULL,
	`specialty` text NOT NULL,
	`degree` text NOT NULL,
	`room` text NOT NULL,
	`consultation_fee` integer NOT NULL,
	`avatar_color` text NOT NULL,
	`available_status` text DEFAULT 'AVAILABLE' NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `doctors_user_id_unique` ON `doctors` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `doctors_doctor_code_unique` ON `doctors` (`doctor_code`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`appointment_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`service_fee` integer NOT NULL,
	`medicine_fee` integer DEFAULT 0 NOT NULL,
	`insurance_discount` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`status` text NOT NULL,
	`payment_method` text,
	`paid_at` text,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_appointment_id_unique` ON `invoices` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `medical_records` (
	`id` text PRIMARY KEY NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`appointment_id` text NOT NULL,
	`diagnosis` text NOT NULL,
	`notes` text NOT NULL,
	`visit_date` text NOT NULL,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `medical_records_appointment_id_unique` ON `medical_records` (`appointment_id`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text NOT NULL,
	`is_read` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `patients` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`patient_code` text NOT NULL,
	`insurance_number` text,
	`insurance_level` integer DEFAULT 0 NOT NULL,
	`date_of_birth` text NOT NULL,
	`gender` text NOT NULL,
	`address` text NOT NULL,
	`blood_type` text NOT NULL,
	`emergency_contact` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `patients_user_id_unique` ON `patients` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `patients_patient_code_unique` ON `patients` (`patient_code`);--> statement-breakpoint
CREATE TABLE `prescription_items` (
	`id` text PRIMARY KEY NOT NULL,
	`prescription_id` text NOT NULL,
	`medicine_name` text NOT NULL,
	`dosage` text NOT NULL,
	`frequency` text NOT NULL,
	`duration_days` integer NOT NULL,
	`instruction` text NOT NULL,
	`unit_price` integer NOT NULL,
	FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prescriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`patient_id` text NOT NULL,
	`doctor_id` text NOT NULL,
	`appointment_id` text NOT NULL,
	`status` text NOT NULL,
	`re_exam_date` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `medical_records`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`role` text NOT NULL,
	`full_name` text NOT NULL,
	`phone` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);