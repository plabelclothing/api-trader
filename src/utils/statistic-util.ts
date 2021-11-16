let timeRequest: { [key: string]: any } = {};
let delayedMessage = 0;

const statisticUtil = function () {
};

statisticUtil.setTimeRequest = (time: number, system: string, status: string | boolean) => {
    timeRequest[system] = {};
    timeRequest[system].time = time;
    if (status) {
        timeRequest[system].status = status;
    }
};

statisticUtil.getTimeRequest = () => {
    return timeRequest;
};

statisticUtil.setDelayedMessage = () => {
    delayedMessage += 1;
};

statisticUtil.getDelayedMessage = () => {
    return delayedMessage;
};

statisticUtil.createStatistics = () => {
    return {
        queueStats: statisticUtil.getDelayedMessage(),
        responseTime: statisticUtil.getTimeRequest(),
    }
};

export {
    statisticUtil,
}
