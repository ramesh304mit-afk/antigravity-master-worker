"use strict";
(self.webpackChunktradingview = self.webpackChunktradingview || []).push([[70059], {
  709295: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFixedRangeVolumeProfile: () => LineToolFixedRangeVolumeProfile });

    var n = i(185842),
        s = i(779998),
        r = i(760075),
        o = i(956879),
        l = i(201600),
        pt = i(657415),
        comp = i(839762),
        hit = i(427927);

    // Ensure TradingView default properties exist for study_VbPFixed
    if (typeof window !== "undefined" && window.TradingView && window.TradingView.defaultProperties) {
      const Ne = {
        styles: {
          developingPoc: { color: "#f23645" },
          developingVAHigh: { color: "#2962FF" },
          developingVALow: { color: "#2962FF" }
        },
        graphics: {
          hhists: {
            histBars2: { colors: ["#26a69a", "#ef5350"], valuesColor: "#2962FF" },
            histBarsVA: { colors: ["rgba(38,166,154,0.75)", "rgba(239,83,80,0.75)"], valuesColor: "#2962FF" }
          },
          horizlines: {
            pocLines: { color: "#f23645" }
          },
          polygons: {
            histBoxBg: { color: "rgba(41,98,255,0.05)" }
          }
        }
      };
      if (!window.TradingView.defaultProperties["study_VbPFixed@tv-basicstudies"]) {
        window.TradingView.defaultProperties["study_VbPFixed@tv-basicstudies"] = Ne;
      }
      if (!window.TradingView.defaultProperties["study_VbPFixed@tv-volumebyprice"]) {
        window.TradingView.defaultProperties["study_VbPFixed@tv-volumebyprice"] = Ne;
      }
      if (!window.TradingView.defaultProperties.linetoolfixedrangevolumeprofile) {
        window.TradingView.defaultProperties.linetoolfixedrangevolumeprofile = {
          linecolor: "#2962FF",
          linewidth: 1,
          linestyle: 0,
          rowsLayout: "Number Of Rows",
          rows: 24,
          volume: "Up/Down",
          vaVolume: 70,
          extendRight: false
        };
      }
    }

    class VolumeProfileRenderer {
      constructor() {
        this._data = null;
      }

      setData(data) {
        this._data = data;
      }

      draw(ctx, e) {
        if (!this._data) return;
        const { leftX, rightX, topY, bottomY, pocY, vahY, valY, rowBars, isSelected, p1, p2 } = this._data;

        ctx.save();

        const minY = Math.min(topY, bottomY);
        const boxHeight = Math.max(1, Math.abs(bottomY - topY));
        const boxWidth = Math.max(1, rightX - leftX);

        // 1. Draw range box background
        ctx.fillStyle = "rgba(41, 98, 255, 0.05)";
        ctx.fillRect(leftX, minY, boxWidth, boxHeight);

        // 2. Draw vertical range boundary lines
        ctx.strokeStyle = isSelected ? "#2962FF" : "rgba(41, 98, 255, 0.6)";
        ctx.lineWidth = isSelected ? 1.5 : 1;
        ctx.beginPath();
        ctx.moveTo(leftX, minY);
        ctx.lineTo(leftX, minY + boxHeight);
        ctx.moveTo(rightX, minY);
        ctx.lineTo(rightX, minY + boxHeight);
        ctx.stroke();

        // 3. Draw histogram bars
        rowBars.forEach(bar => {
          // Up volume (sky blue / teal)
          ctx.fillStyle = bar.isVa ? "#26a69a" : "rgba(38, 166, 154, 0.4)";
          ctx.fillRect(bar.left, bar.top, bar.upWidth, bar.height - 1);

          // Down volume (berry pink / red)
          ctx.fillStyle = bar.isVa ? "#ef5350" : "rgba(239, 83, 80, 0.4)";
          ctx.fillRect(bar.left + bar.upWidth, bar.top, bar.downWidth, bar.height - 1);
        });

        // 4. Draw Value Area High & Low lines
        ctx.strokeStyle = "rgba(41, 98, 255, 0.75)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        if (Number.isFinite(vahY)) {
          ctx.beginPath();
          ctx.moveTo(leftX, vahY);
          ctx.lineTo(rightX, vahY);
          ctx.stroke();
        }
        if (Number.isFinite(valY)) {
          ctx.beginPath();
          ctx.moveTo(leftX, valY);
          ctx.lineTo(rightX, valY);
          ctx.stroke();
        }

        // 5. Draw POC (Point of Control) line in bright red/orange
        if (Number.isFinite(pocY)) {
          ctx.setLineDash([]);
          ctx.strokeStyle = "#f23645";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(leftX, pocY);
          ctx.lineTo(rightX, pocY);
          ctx.stroke();
        }

        // 6. Draw anchor handles
        [p1, p2].forEach(p => {
          if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
            ctx.fillStyle = "#FFFFFF";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#2962FF";
            ctx.stroke();
          }
        });

        ctx.restore();
      }

      hitTest(point) {
        if (!this._data) return null;
        const { leftX, rightX, topY, bottomY, p1, p2 } = this._data;

        if (p1 && Math.hypot(point.x - p1.x, point.y - p1.y) <= 8) {
          return new hit.HitTestResult(hit.HitTarget.ChangePoint, { pointIndex: 0 });
        }
        if (p2 && Math.hypot(point.x - p2.x, point.y - p2.y) <= 8) {
          return new hit.HitTestResult(hit.HitTarget.ChangePoint, { pointIndex: 1 });
        }

        const minY = Math.min(topY, bottomY);
        const maxY = Math.max(topY, bottomY);
        if (point.x >= leftX - 4 && point.x <= rightX + 4 && point.y >= minY - 4 && point.y <= maxY + 4) {
          return new hit.HitTestResult(hit.HitTarget.MovePoint);
        }
        return null;
      }
    }

    class VolumeProfilePaneView {
      constructor(source, model) {
        this._source = source;
        this._model = model;
        this._invalidated = true;
        this._renderer = null;
        this._customRenderer = new VolumeProfileRenderer();
      }

      update() {
        this._invalidated = true;
      }

      renderer(e) {
        if (this._invalidated) {
          this._updateImpl(e);
          this._invalidated = false;
        }
        return this._renderer;
      }

      _updateImpl(e) {
        this._renderer = null;
        const pts = this._source.points();
        if (!pts || pts.length < 2) return;

        const timeScale = this._model.timeScale();
        const priceScale = this._source.priceScale() || this._model.mainSeries().priceScale();
        const ownerSource = this._source.ownerSource() || this._model.mainSeries();
        const firstValue = ownerSource ? ownerSource.firstValue() : null;

        if (!timeScale || !priceScale || firstValue === null) return;

        const x1 = timeScale.indexToCoordinate(pts[0].index);
        const x2 = timeScale.indexToCoordinate(pts[1].index);
        const y1 = priceScale.priceToCoordinate(pts[0].price, firstValue);
        const y2 = priceScale.priceToCoordinate(pts[1].price, firstValue);

        if (x1 === null || x2 === null || y1 === null || y2 === null) return;

        const leftX = Math.min(x1, x2);
        const rightX = Math.max(x1, x2);
        const minIndex = Math.min(pts[0].index, pts[1].index);
        const maxIndex = Math.max(pts[0].index, pts[1].index);

        const series = this._model.mainSeries();
        const barsList = series && series.bars ? series.bars() : null;

        let lowPrice = Infinity;
        let highPrice = -Infinity;
        const candleBars = [];

        if (barsList && typeof barsList.range === "function") {
          try {
            const range = barsList.range(minIndex, maxIndex);
            range.each((idx, bar) => {
              if (bar && bar.value) {
                const b = {
                  open: bar.value[1],
                  high: bar.value[2],
                  low: bar.value[3],
                  close: bar.value[4],
                  volume: bar.value[5] || 1
                };
                lowPrice = Math.min(lowPrice, b.low);
                highPrice = Math.max(highPrice, b.high);
                candleBars.push(b);
              }
            });
          } catch (err) {}
        }

        if (candleBars.length === 0 || !Number.isFinite(lowPrice) || !Number.isFinite(highPrice)) {
          lowPrice = Math.min(pts[0].price, pts[1].price);
          highPrice = Math.max(pts[0].price, pts[1].price);
          if (lowPrice === highPrice || !Number.isFinite(lowPrice)) {
            lowPrice = pts[0].price * 0.99;
            highPrice = pts[0].price * 1.01;
          }
        }

        const numRows = 24;
        const priceStep = Math.max(0.01, (highPrice - lowPrice) / numRows);
        const bins = Array.from({ length: numRows }, () => ({ up: 0, down: 0, total: 0 }));

        if (candleBars.length > 0) {
          candleBars.forEach(b => {
            const isUp = b.close >= b.open;
            const bLow = Math.max(lowPrice, b.low);
            const bHigh = Math.min(highPrice, b.high);
            const startBin = Math.max(0, Math.min(numRows - 1, Math.floor((bLow - lowPrice) / priceStep)));
            const endBin = Math.max(0, Math.min(numRows - 1, Math.floor((bHigh - lowPrice) / priceStep)));
            const span = Math.max(1, endBin - startBin + 1);
            const volPerBin = (b.volume || 100) / span;

            for (let bin = startBin; bin <= endBin; bin++) {
              if (isUp) {
                bins[bin].up += volPerBin;
              } else {
                bins[bin].down += volPerBin;
              }
              bins[bin].total += volPerBin;
            }
          });
        } else {
          for (let i = 0; i < numRows; i++) {
            const norm = (i - numRows / 2) / (numRows / 4);
            const v = Math.exp(-0.5 * norm * norm) * 1000 + 100;
            bins[i].up = v * 0.55;
            bins[i].down = v * 0.45;
            bins[i].total = v;
          }
        }

        let maxVol = 0;
        let pocBin = 0;
        let totalVolume = 0;
        bins.forEach((bin, idx) => {
          totalVolume += bin.total;
          if (bin.total > maxVol) {
            maxVol = bin.total;
            pocBin = idx;
          }
        });

        const targetVaVol = totalVolume * 0.70;
        let currentVaVol = bins[pocBin].total;
        let vaLowBin = pocBin;
        let vaHighBin = pocBin;

        while (currentVaVol < targetVaVol && (vaLowBin > 0 || vaHighBin < numRows - 1)) {
          const upVol = (vaHighBin + 1 < numRows) ? bins[vaHighBin + 1].total : -1;
          const downVol = (vaLowBin - 1 >= 0) ? bins[vaLowBin - 1].total : -1;

          if (upVol >= downVol && upVol >= 0) {
            vaHighBin++;
            currentVaVol += upVol;
          } else if (downVol >= 0) {
            vaLowBin--;
            currentVaVol += downVol;
          } else {
            break;
          }
        }

        const pocPrice = lowPrice + (pocBin + 0.5) * priceStep;
        const vahPrice = lowPrice + (vaHighBin + 1) * priceStep;
        const valPrice = lowPrice + vaLowBin * priceStep;

        const pocY = priceScale.priceToCoordinate(pocPrice, firstValue);
        const vahY = priceScale.priceToCoordinate(vahPrice, firstValue);
        const valY = priceScale.priceToCoordinate(valPrice, firstValue);

        const rowBars = bins.map((bin, idx) => {
          const p1 = lowPrice + idx * priceStep;
          const p2 = lowPrice + (idx + 1) * priceStep;
          const cy1 = priceScale.priceToCoordinate(p1, firstValue);
          const cy2 = priceScale.priceToCoordinate(p2, firstValue);
          const top = Math.min(cy1, cy2);
          const height = Math.max(1, Math.abs(cy2 - cy1));
          const isVa = idx >= vaLowBin && idx <= vaHighBin;

          const maxWidth = Math.max(10, (rightX - leftX) * 0.75);
          const upW = maxVol > 0 ? (bin.up / maxVol) * maxWidth : 0;
          const downW = maxVol > 0 ? (bin.down / maxVol) * maxWidth : 0;

          return {
            top,
            height,
            left: leftX,
            upWidth: upW,
            downWidth: downW,
            isVa
          };
        });

        const isSelected = this._model.selection().isSelected(this._source);

        this._customRenderer.setData({
          leftX,
          rightX,
          topY: priceScale.priceToCoordinate(highPrice, firstValue),
          bottomY: priceScale.priceToCoordinate(lowPrice, firstValue),
          pocY,
          vahY,
          valY,
          rowBars,
          isSelected,
          p1: new pt.Point(x1, y1),
          p2: new pt.Point(x2, y2)
        });

        const container = new comp.CompositeRenderer();
        container.append(this._customRenderer);
        this._renderer = container;
      }
    }

    class LineToolFixedRangeVolumeProfile extends l.LineDataSource {
      constructor(model, properties, study, points, options) {
        super(model, properties ?? LineToolFixedRangeVolumeProfile.createProperties(model.backgroundTheme().spawnOwnership()), points, options);
        this.version = 1;
        this._paneView = new VolumeProfilePaneView(this, this._model);
        this._setPaneViews([this._paneView]);
      }

      pointsCount() {
        return 2;
      }

      name() {
        return "Fixed Range";
      }

      anchorable() {
        return false;
      }

      metaInfo() {
        return {
          id: "VbPFixed@tv-basicstudies-152",
          description: "Fixed Range",
          shortDescription: "Fixed Range",
          is_hidden_study: true
        };
      }

      _getPropertyDefinitionsViewModelClass() {
        return Promise.all([i.e(61982), i.e(53835), i.e(3967), i.e(6108), i.e(59328)])
          .then(i.bind(i, 281021))
          .then(e => e.GeneralLineDefinitionsViewModel || e.HorizontalLineDefinitionsViewModel);
      }

      static createProperties(theme, state) {
        const p = new r.DefaultProperty({
          defaultName: "linetoolfixedrangevolumeprofile",
          state: state,
          theme: theme
        });
        return this._configureProperties(p), p;
      }

      static createPropertiesFromStudyMetaInfoAndState(metaInfo, state, i, s, theme) {
        const p = new r.DefaultProperty({
          defaultName: "linetoolfixedrangevolumeprofile",
          state: state,
          theme: theme
        });
        return this._configureProperties(p), p;
      }

      static _configureProperties(e) {
        super._configureProperties(e);
        if (!e.hasChild("linecolor")) e.addChild("linecolor", new s.Property("#2962FF"));
        if (!e.hasChild("linewidth")) e.addChild("linewidth", new s.Property(1));
        if (!e.hasChild("linestyle")) e.addChild("linestyle", new s.Property(0));
        if (!e.hasChild("rowsLayout")) e.addChild("rowsLayout", new s.Property("Number Of Rows"));
        if (!e.hasChild("rows")) e.addChild("rows", new s.Property(24));
        if (!e.hasChild("volume")) e.addChild("volume", new s.Property("Up/Down"));
        if (!e.hasChild("vaVolume")) e.addChild("vaVolume", new s.Property(70));
        if (!e.hasChild("extendRight")) e.addChild("extendRight", new s.Property(false));

        if (!e.hasChild("linesColors")) e.addChild("linesColors", new o.LineToolColorsProperty([(0, n.ensureDefined)(e.child("linecolor"))]));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new o.LineToolWidthsProperty([(0, n.ensureDefined)(e.child("linewidth"))]));
      }
    }
  },
  315082: (e, t, i) => {
    i.r(t);
    const mod = i(709295);
    i.d(t, { LineToolVbPFixed: () => mod.LineToolFixedRangeVolumeProfile });
  }
}]);
