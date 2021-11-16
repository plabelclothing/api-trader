"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statisticUtil = void 0;
let timeRequest = {};
let delayedMessage = 0;
const statisticUtil = function () {
};
exports.statisticUtil = statisticUtil;
statisticUtil.setTimeRequest = (time, system, status) => {
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
    };
};
