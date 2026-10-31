"use strict";
(self.webpackChunktradingview = self.webpackChunktradingview || []).push([[1826], {
  527063: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolVertLine: () => VertLineTool });

    var n = i(185842);
    var s = i(779998);
    var r = i(760075);
    var o = i(956879);
    var a = i(99051); // InplaceTextLineDataSource
    var hit = i(427927); // HitTestResult, HitTarget
    var rend = i(484990); // VerticalLineRenderer
    var comp = i(839762); // CompositeRenderer
    var pt = i(657415); // Point
    var anchor = i(389155); // lineSourcePaneViewPointToLineAnchorPoint
    var basePane = i(595125); // InplaceTextLineSourcePaneView

    class VertLinePaneView extends basePane.InplaceTextLineSourcePaneView {
      constructor(source, model, openEditor, closeEditor) {
        super(source, model, openEditor, closeEditor);
        this._invalidated = true;
        this._renderer = null;
        this._lastX = null;
        this._lineRenderer = new rend.VerticalLineRenderer();
        this._lineRenderer.setHitTest(new hit.HitTestResult(hit.HitTarget.MovePoint));
      }
      update() {
        this._invalidated = true;
      }
      renderer(e) {
        if (this._invalidated) {
          this._updateImpl(e);
          this._invalidated = false;
        } else {
          const pts = this._source.points();
          if (pts && pts.length > 0) {
            const curX = this._model.timeScale().indexToCoordinate(pts[0].index);
            if (curX !== this._lastX) {
              this._updateImpl(e);
            }
          }
        }
        return this._renderer;
      }
      _updateImpl(e) {
        this._renderer = null;
        const pts = this._source.points();
        if (!pts || pts.length === 0) return;
        const timeScale = this._model.timeScale();
        if (!timeScale || timeScale.isEmpty()) return;
        const x = timeScale.indexToCoordinate(pts[0].index);
        if (x === null || !Number.isFinite(x)) return;
        this._lastX = x;

        const height = e?.mediaSize?.height || 500;
        const screenPt = new pt.Point(x, height / 2);
        this._points = [screenPt];

        const props = this._source.properties().childs();
        const container = new comp.CompositeRenderer();
        const color = props.linecolor ? props.linecolor.value() : "#2962FF";
        const linewidth = props.linewidth ? props.linewidth.value() : 1;
        const linestyle = props.linestyle ? props.linestyle.value() : 0;
        const v = {
          x: x,
          color: color,
          linewidth: linewidth,
          linestyle: linestyle
        };
        this._lineRenderer.setData(v);
        const snappingIdx = pts[0]?.index ?? 0;
        this._lineRenderer.setHitTest(new hit.HitTestResult(hit.HitTarget.MovePoint, { snappingIndex: snappingIdx }));
        container.append(this._lineRenderer);

        if (!this._isTextEditMode()) {
          const anch = (0, anchor.lineSourcePaneViewPointToLineAnchorPoint)(screenPt, 0);
          anch.snappingIndex = snappingIdx;
          container.append(this.createLineAnchor({ points: [anch] }, 0));
        }
        this._renderer = container;
      }
    }

    class VertLineTool extends a.InplaceTextLineDataSource {
      constructor(e, t, n, s) {
        super(e, t ?? VertLineTool.createProperties(e.backgroundTheme().spawnOwnership()), n, s);
        this._setPaneViews([new VertLinePaneView(this, this._model, this._openTextEditor.bind(this), this._closeTextEditor.bind(this))]);
      }
      pointsCount() {
        return 1;
      }
      name() {
        return "Vertical Line";
      }
      priceAxisViews() {
        return null;
      }
      timeAxisPoints() {
        return this._points;
      }
      canHasAlert() {
        return true;
      }
      template() {
        const e = super.template();
        if (this.properties().hasChild("text")) {
          e.text = this.properties().childs().text.value();
        }
        return e;
      }
      denormalizeTimePoints() {
        this._points = [];
        if (this._timePoint && this._timePoint.length > 0) {
          const p = this._timePoint[0];
          const idx = p.index !== undefined ? p.index : (this._model.timeScale().timePointToIndex(p.time) ?? 0);
          this._points.push({
            price: p.price || 0,
            index: idx,
            interval: this._model.mainSeries().interval()
          });
        }
      }
      clearData() {
        const e = this._points;
        super.clearData();
        this._points = e;
      }
      editableTextProperties() {
        const e = this.properties().childs();
        return { text: e.text, textColor: e.textcolor || e.linecolor };
      }
      static createProperties(e, t) {
        const i = new r.DefaultProperty({ defaultName: "linetoolvertline", state: t, theme: e });
        return this._configureProperties(i), i;
      }
      _pointsForPointset() {
        return [];
      }
      _getPropertyDefinitionsViewModelClass() {
        return Promise.all([i.e(61982), i.e(53835), i.e(3967), i.e(6108), i.e(59328)])
          .then(i.bind(i, 281021))
          .then(e => e.HorizontalLineDefinitionsViewModel || e.GeneralLineDefinitionsViewModel);
      }
      _applyTemplateImpl(e) {
        super._applyTemplateImpl(e);
        if (this.properties().hasChild("text")) {
          this.properties().childs().text.setValue(e.text || "");
        }
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        e.hasChild("linecolor") || e.addChild("linecolor", new s.Property("#2962FF"));
        e.hasChild("linewidth") || e.addChild("linewidth", new s.Property(1));
        e.hasChild("linestyle") || e.addChild("linestyle", new s.Property(0));
        e.hasChild("text") || e.addChild("text", new s.Property(""));
        e.addExcludedKey("text", 1);
        if (!e.hasChild("textcolor")) {
          e.addChild("textcolor", new s.Property(e.child("linecolor").value()));
        }
        if (!e.hasChild("linesColors")) {
          e.addChild("linesColors", new o.LineToolColorsProperty([e.child("linecolor")]));
        }
        if (!e.hasChild("linesWidths")) {
          e.addChild("linesWidths", new o.LineToolWidthsProperty([e.child("linewidth")]));
        }
        if (!e.hasChild("textsColors")) {
          e.addChild("textsColors", new o.LineToolColorsProperty([e.child("textcolor")]));
        }
      }
    }
  }
}]);
