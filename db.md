| table_name   | column_name              | data_type                   | is_nullable |
| ------------ | ------------------------ | --------------------------- | ----------- |
| account      | id                       | text                        | NO          |
| account      | account_id               | text                        | NO          |
| account      | provider_id              | text                        | NO          |
| account      | user_id                  | text                        | NO          |
| account      | access_token             | text                        | YES         |
| account      | refresh_token            | text                        | YES         |
| account      | id_token                 | text                        | YES         |
| account      | access_token_expires_at  | timestamp without time zone | YES         |
| account      | refresh_token_expires_at | timestamp without time zone | YES         |
| account      | scope                    | text                        | YES         |
| account      | password                 | text                        | YES         |
| account      | created_at               | timestamp without time zone | NO          |
| account      | updated_at               | timestamp without time zone | NO          |
| banned_cnic  | id                       | integer                     | NO          |
| banned_cnic  | cnic_hash                | text                        | NO          |
| banned_cnic  | reason                   | text                        | NO          |
| banned_cnic  | banned_at                | timestamp without time zone | NO          |
| chat_message | id                       | integer                     | NO          |
| chat_message | conversation_id          | integer                     | NO          |
| chat_message | sender_id                | text                        | NO          |
| chat_message | type                     | USER-DEFINED                | NO          |
| chat_message | text                     | character varying           | YES         |
| chat_message | offer_amount             | real                        | YES         |
| chat_message | offer_status             | USER-DEFINED                | YES         |
| chat_message | previous_offer_id        | integer                     | YES         |
| chat_message | timestamp                | timestamp without time zone | NO          |
| conversation | id                       | integer                     | NO          |
| conversation | listing_id               | integer                     | NO          |
| conversation | buyer_id                 | text                        | NO          |
| conversation | seller_id                | text                        | NO          |
| conversation | last_message             | text                        | YES         |
| conversation | last_offer_status        | USER-DEFINED                | YES         |
| conversation | last_message_at          | timestamp without time zone | YES         |
| conversation | created_at               | timestamp without time zone | NO          |
| conversation | updated_at               | timestamp without time zone | NO          |
| dispute      | id                       | integer                     | NO          |
| dispute      | transaction_id           | integer                     | NO          |
| dispute      | reporter_id              | text                        | NO          |
| dispute      | reason                   | USER-DEFINED                | NO          |
| dispute      | description              | character varying           | NO          |
| dispute      | images                   | ARRAY                       | YES         |
| dispute      | status                   | USER-DEFINED                | NO          |
| dispute      | resolution               | USER-DEFINED                | YES         |
| dispute      | admin_notes              | text                        | YES         |
| dispute      | resolved_at              | timestamp without time zone | YES         |
| dispute      | created_at               | timestamp without time zone | NO          |
| dispute      | updated_at               | timestamp without time zone | NO          |
| favorite     | id                       | uuid                        | NO          |
| favorite     | user_id                  | text                        | NO          |
| favorite     | listing_id               | bigint                      | NO          |
| favorite     | created_at               | timestamp with time zone    | YES         |
| listing      | id                       | integer                     | NO          |
| listing      | title                    | character varying           | NO          |
| listing      | description              | character varying           | NO          |
| listing      | price                    | real                        | NO          |
| listing      | condition                | USER-DEFINED                | NO          |
| listing      | category                 | text                        | NO          |
| listing      | size                     | text                        | YES         |
| listing      | brand                    | text                        | YES         |
| listing      | images                   | ARRAY                       | NO          |
| listing      | seller_id                | text                        | NO          |
| listing      | status                   | USER-DEFINED                | NO          |
| listing      | moderation_status        | USER-DEFINED                | NO          |
| listing      | share_slug               | character varying           | YES         |
| listing      | view_count               | integer                     | NO          |
| listing      | created_at               | timestamp without time zone | NO          |
| listing      | updated_at               | timestamp without time zone | NO          |
| listing      | department               | text                        | NO          |
| listing      | subcategory              | text                        | YES         |
| session      | id                       | text                        | NO          |
| session      | expires_at               | timestamp without time zone | NO          |
| session      | token                    | text                        | NO          |
| session      | created_at               | timestamp without time zone | NO          |
| session      | updated_at               | timestamp without time zone | NO          |
| session      | ip_address               | text                        | YES         |
| session      | user_agent               | text                        | YES         |
| session      | user_id                  | text                        | NO          |
| transaction  | id                       | integer                     | NO          |
| transaction  | listing_id               | integer                     | NO          |
| transaction  | conversation_id          | integer                     | NO          |
| transaction  | buyer_id                 | text                        | NO          |
| transaction  | seller_id                | text                        | NO          |
| transaction  | agreed_amount            | real                        | NO          |
| transaction  | platform_fee             | real                        | NO          |
| transaction  | seller_payout            | real                        | NO          |
| transaction  | status                   | USER-DEFINED                | NO          |
| transaction  | payment_gateway          | USER-DEFINED                | NO          |
| transaction  | gateway_ref              | text                        | YES         |
| transaction  | shipping_tracking_id     | text                        | YES         |
| transaction  | delivery_confirmed_at    | timestamp without time zone | YES         |
| transaction  | refund_deadline          | timestamp without time zone | YES         |
| transaction  | created_at               | timestamp without time zone | NO          |
| transaction  | updated_at               | timestamp without time zone | NO          |
| user         | id                       | text                        | NO          |
| user         | name                     | text                        | NO          |
| user         | email                    | text                        | NO          |
| user         | email_verified           | boolean                     | NO          |
| user         | image                    | text                        | YES         |
| user         | created_at               | timestamp without time zone | NO          |
| user         | updated_at               | timestamp without time zone | NO          |
| user         | phone_number             | text                        | YES         |
| user         | phone_number_verified    | boolean                     | YES         |
| user_profile | id                       | integer                     | NO          |
| user_profile | user_id                  | text                        | NO          |
| user_profile | city                     | text                        | YES         |
| user_profile | cnic_encrypted           | text                        | YES         |
| user_profile | cnic_hash                | text                        | YES         |
| user_profile | verified                 | boolean                     | YES         |
| user_profile | rating                   | real                        | YES         |
| user_profile | rating_count             | integer                     | YES         |
| user_profile | bank_account_title       | text                        | YES         |
| user_profile | bank_account_number      | text                        | YES         |
| user_profile | bank_name                | text                        | YES         |
| user_profile | banned                   | boolean                     | YES         |
| user_profile | created_at               | timestamp without time zone | NO          |
| user_profile | updated_at               | timestamp without time zone | NO          |
| verification | id                       | text                        | NO          |
| verification | identifier               | text                        | NO          |
| verification | value                    | text                        | NO          |
| verification | expires_at               | timestamp without time zone | NO          |
| verification | created_at               | timestamp without time zone | YES         |
| verification | updated_at               | timestamp without time zone | YES         |