CREATE TABLE `crosswords` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`grid_size` integer DEFAULT 7 NOT NULL,
	`number_range` text DEFAULT '{"min": 1, "max": 20}' NOT NULL,
	`operations` text DEFAULT '["+"]' NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`sid` text PRIMARY KEY NOT NULL,
	`sess` text NOT NULL,
	`expire` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `IDX_session_expire` ON `sessions` (`expire`);--> statement-breakpoint
CREATE TABLE `user_crossword_history` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`crossword_id` text NOT NULL,
	`time_spent` integer NOT NULL,
	`score` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`crossword_id`) REFERENCES `crosswords`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`default_grid_size` integer DEFAULT 7 NOT NULL,
	`number_range` text DEFAULT '{"min": 1, "max": 20}' NOT NULL,
	`operations` text DEFAULT '["+", "-", "×"]' NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_settings_user_id_unique` ON `user_settings` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`first_name` text,
	`last_name` text,
	`profile_image_url` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);