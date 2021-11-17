const config = module.exports = {};

config.application = 'api-trader';
config.applicationKey = 'ac8ab61a-1bfc-4e50-88bd-97217305898c';

config.expressApi = {
	bind:               '',
	port:               null,
	authorizationToken: '',
};

config.luxon = {
	timezone: 'Europe/Warsaw'
};

config.rabbitMQ = {
	connection:         [],
	deadLetterExchange: {
		exchange: 'trader_dlx',
	},
	deadLetterQueue:    {
		key: 'trader_dlx_queue10',
		ttl: 10000
	},
	channel:            'trader',
	exchange:           'trader_default',
	consumerOptions:    {
		noAck:     false,
		exclusive: false
	},
	consumerPrefetch:   5,
	reconnectPeriod:    5000
};

config.winston = {
	console:     {
		level:            'info',
		handleExceptions: true,
		json:             false,
		colorize:         false,
	},
	file:        {
		level:            'warn',
		handleExceptions: true,
		filename:         'logs/app.log',
		json:             true,
		maxsize:          5242880, // 5MB
		maxFiles:         100,
		colorize:         false
	},
	sentry:      {
		level: 'error',
		dsn:   ''
	},
	transports:  {
		file:    {
			enabled: false
		},
		console: {
			enabled: true
		},
		sentry:  {
			enabled: false
		}
	},
	exitOnError: false
};

config.coinbase = {
	host:       '',
	key:        '',
	passphrase: '',
	secret:     ''
};


config.trade = {
	cryptoBuyAmount: {
		btcEur: 0,
		btcUsd: 0,
	},
	isTrade:         {
		btcEur: false,
		btcUsd: false,
	},
	serviceFee:      0,
};

config.assets = {
	waitTransactionFilePath: ''
};

module.exports = config;
