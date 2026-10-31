"use strict";
(self.webpackChunktradingview = self.webpackChunktradingview || []).push([[47723], {
  812538: (e, t, i) => {
    i.r(t);
    class ActionsProvider {
      constructor(chartWidget) {
        this._chartWidget = chartWidget;
      }
      actionForLineTools(sources, actionId) {
        return null;
      }
      contextMenuActionsForSource(source) {
        return [];
      }
    }
    i.d(t, {
      ActionsProvider: () => ActionsProvider,
      createCreateOrderAction: () => (() => Promise.resolve(null)),
      createSyncDrawingActions: () => (() => []),
      createActionToggleVisibilityDataSources: () => (() => null),
      createActionToggleIntervalVisibilitiesAction: () => (() => null),
      createVisualOrderAction: () => (() => null),
      createChangeIntervalsVisibilitiesAction: () => (() => null)
    });
  }
}]);
