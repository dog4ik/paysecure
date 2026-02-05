CREATE TABLE `pub_keys` (
	`id` integer PRIMARY KEY NOT NULL,
	`key` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pub_keys_key_unique` ON `pub_keys` (`key`);--> statement-breakpoint
CREATE TABLE `tx_data` (
	`id` integer PRIMARY KEY NOT NULL,
	`private_key` text NOT NULL,
	`gateway_token` text NOT NULL,
	`token` text NOT NULL,
	`pub_key_id` integer NOT NULL,
	FOREIGN KEY (`pub_key_id`) REFERENCES `pub_keys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tx_data_gateway_token_unique` ON `tx_data` (`gateway_token`);