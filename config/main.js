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
		exchange:    'trader_dlx',
		exchangeFee: 'trader_dlx_fee',
	},
	deadLetterQueue:    {
		sell: {
			key: 'trader_dlx_queue5',
			ttl: 5000
		},
		fee:  {
			key: 'trader_dlx_queue60',
			ttl: 60000
		}
	},
	channel:            'trader',
	channelFee:         'trader_fee',
	exchange:           'trader_default',
	exchangeFee:        'trader_fee',
	consumerOptions:    {
		noAck:     false,
		exclusive: false
	},
	consumerPrefetch:   1,
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
	waitTransactionFilePath: {
		'BTC-USD': '',
		'BTC-EUR': '',
	},
};

config.profile = {
	trade:  '',
	saving: ''
};

module.exports = config;
