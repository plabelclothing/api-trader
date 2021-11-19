/**
 * @module config/production
 */
'use strict';

const config = module.exports = {};

config.expressApi = {
	bind:   '{{ api_trader_bind_address }}',
	port:   {{ api_trader_bind_port }},
	authorizationToken: '{{ api_trader_authorization_token }}'
};

config.winston = {
	file:   {
		filename:   '{{ api_trader_logfilename }}'
	},
	sentry: {
		dsn:    '{{ api_trader_sentry_dsn }}'
	}
};

config.rabbitMQ = {
	connection: [
		{
			hostname:  '{{ api_trader_mqtt_hostname_first }}',
			port:       {{ api_trader_mqtt_port_first }},
			username:  '{{ api_trader_mqtt_user_first }}',
			password:  '{{ api_trader_mqtt_password_first }}',
			vhost:     '{{ api_trader_mqtt_vhost_first }}'
		}
	],
	consumerPrefetch: {{ api_trader_mqtt_consumer_prefetch }}
};

config.coinbase = {
	host:       '{{ api_trader_coinbase_host }}',
	key:        '{{ api_trader_coinbase_key }}',
	passphrase: '{{ api_trader_coinbase_passphrase }}',
	secret:     '{{ api_trader_coinbase_secret }}',
};

config.trade = {
	cryptoBuyAmount: {
		btcUsd: '{{ api_trader_trade_btc_usd_buy_amount }}',
		btcEur: '{{ api_trader_trade_btc_eur_buy_amount }}',
	},
	isTrade:         {
		btcEur: {{ api_trader_trade_is_trade_btc_eur }},
		btcUsd: {{ api_trader_trade_is_trade_btc_usd }},
	},
	serviceFee:      {{ api_trader_trade_service_fee }},
};

config.assets = {
	waitTransactionFilePath: '{{ api_trader_assets_wait_transaction_path }}'
};

config.assets = {
	waitTransactionFilePath: {
		'BTC-USD': '{{ api_trader_assets_wait_transaction_path_btc_usd }}',
		'BTC-EUR': '{{ api_trader_assets_wait_transaction_path_btc_eur }}',
	}
};

config.profile = {
	trade: '{{ api_trader_profile_trade }}',
	saving: '{{ api_trader_profile_saving }}',
};