"use strict";(self.webpackChunktradingview = self.webpackChunktradingview || []).push([[10788,74878,64588,21596,90470,84984,57234,26070,46739,72465,45947,52086,71596,56409,50317,29467,11939,70688,69813,66775,67566,58899,58594,5680,22012,73254,4802,53835,3967,6108], {
266775:e=>{e.exports={en:["erase level line"]}},
617669:(e,t,i)=>{i.d(t,{LevelsProperty:()=>x});var s=i(436492),n=i(135558),r=i(689903),o=i(760075),a=i(124361);const l={prefixes:[""],range:[0,0],names:["coeff","color","visible","linestyle","linewidth"],typecheck:{pack:()=>Object(),unpack:()=>[]}};function d(e,t,i,s){return s.push(i[t]),s}function c(e,t,i,s){return s[t]=i[e],s}function u(){return[]}function h(){return{}}function p(e,t,i){return i.prefixes.forEach((s=>{const n=s+"level";for(let s=i.range[0];s<=i.range[1];s++)if(e[n+s]&&(0,r.isSameType)(e[n+s],t.typecheck())){let r=t.tpl();i.names.forEach(((i,o)=>{r=t.fill(""+o,i,e[n+s],r)})),e[n+s]=r}})),e}function _(e,t,i){return i(e,{tpl:h,fill:c,typecheck:t.typecheck.unpack},t)}class x extends o.DefaultProperty{constructor(e){const{levelsIterator:t=p,map:i={},...s}=e,n={...l,...i};s.state&&(s.state=_(s.state,n,t)),super(s),this._map=n,this._levelsIterator=t}state(e,t,i){const s=super.state(e,t);return i?s:(n=s,r=this._map,(0,this._levelsIterator)(n,{tpl:u,fill:d,typecheck:r.typecheck.pack},r));var n,r}preferences(){return(0,o.extractState)(this.state(this._excludedDefaultsKeys,void 0,!0),this._allDefaultsKeys)}applyTemplate(e,t){this.mergeAndFire((0,o.extractState)((0,n.default)((0,s.default)(t),_(e,this._map,this._levelsIterator)),this._allStateKeys,this._excludedTemplateKeys))}saveDefaults(){this._useUserPreferences&&(0,a.saveDefaults)(this._defaultName,this.preferences())}clone(){return new x(this._options())}merge(e,t){return super.merge(this._map?_(e,this._map,this._levelsIterator):e,t)}_options(){return{...super._options(),map:{...this._map},levelsIterator:this._levelsIterator}}}},
433979:(e,t,i)=>{i.d(t,{LineToolFibWithInplaceTextBase:()=>d,getLevelProps:()=>a});var s=i(185842),n=i(779998),r=i(99051);const o=new n.Property(!1);function a(e,t){return(0,s.ensureDefined)(e.child(`level${t}`))}class l extends r.InplaceTextUndoCommand{constructor(e,t,i,s,n){super(e,t,i,s),this._levelIndex=n}_textProperty(e){return a(e.properties(),this._levelIndex).childs().text}}class d extends r.InplaceTextLineDataSource{constructor(){super(...arguments),this._inplaceEditLevelIndex=1}editableTextStyle(){return{...super.editableTextStyle(),forbidLineBreaks:!0,maxLength:50}}editableTextProperties(){const e=this.properties().childs();return{text:e.editableText,textColor:e.editableTextColor,wordWrap:o}}setInplaceEditLevelIndex(e){this._destroyEditableTextSubscriptions?.();const t=this.properties(),i=t.childs().editableText,n=t.childs().editableTextColor,r=a(t,e),o=(0,s.ensureDefined)(r).childs().text,l=(0,s.ensureDefined)(r).childs().color,d={};i.setValue(o.value()),n.setValue(l.value()),i.subscribe(d,(()=>o.setValue(i.value()))),o.subscribe(d,(()=>i.setValue(o.value()))),n.subscribe(d,(()=>l.setValue(n.value()))),l.subscribe(d,(()=>n.setValue(l.value()))),this._destroyEditableTextSubscriptions=()=>{i.unsubscribeAll(d),o.unsubscribeAll(d),n.unsubscribeAll(d),l.unsubscribeAll(d)},this._inplaceEditLevelIndex=e,
this._editableText.setValue(i.value())}_changeEditableTextUndoCommand(e,t){return new l(this._model,this,e,t,this._inplaceEditLevelIndex)}static _configureProperties(e){super._configureProperties(e),e.addChild("editableText",new n.Property("")),e.addChild("editableTextColor",new n.Property("")),e.addExcludedKey("editableText",3),e.addExcludedKey("editableTextColor",3)}}},
99051:(e,t,i)=>{i.d(t,{InplaceTextLineDataSource:()=>T,InplaceTextUndoCommand:()=>g})
;var s=i(883991),n=i(185842),r=i(657415),o=i(358868),a=i(955482),l=i(172301),d=i(411227),c=i(896955),u=i(963325),h=i(788905),p=i(201600),_=i(846090),x=i(189819);const v={selectionColor:(0,o.getHexColorByName)("color-tv-blue-500"),cursorColor:(0,o.getHexColorByName)("color-black")},m={selectionColor:(0,o.getHexColorByName)("color-white"),cursorColor:(0,o.getHexColorByName)("color-white")};var b;!function(e){e[e.TextEditingJustFinishedTime=100]="TextEditingJustFinishedTime"}(b||(b={}));class g extends h.UndoCommand{constructor(e,t,s,n){super(new d.TranslatedString("change {title} text",l.t(null,void 0,i(858899))).format({title:new d.TranslatedString(t.name(),t.translatedType())}),!0,!x.lineToolsDoNotAffectChartInvalidation),this._sourceId=t.id(),this._model=e,this._oldValue=s,this._newValue=n}redo(){const e=this._source();this._textProperty(e).setValue(this._newValue)}undo(){const e=this._source();this._textProperty(e).setValue(this._oldValue)}_textProperty(e){return e.editableTextProperties().text}_source(){return(0,n.ensureNotNull)(this._model.dataSourceForId(this._sourceId))}}class T extends p.LineDataSource{constructor(e,t,s,n){super(e,t,s,n),this._container=null,this._activeEditingOwnerSource=null,this._editableText=new u.WatchedValue(""),this._activateTextEditingEl=null,this._paneView=null,this._selectionData={},this._cursorPaneView=null,this._cursorPosition=null,this._editingOnCreation=!1,this._editingActivationTime=null,this._editingDeactivationTime=0,this._editableText.subscribe((()=>{this.updateAllViewsAndRedraw((0,_.sourceChangeEvent)(this.id()))})),this._isDarkBackground=(0,c.combine)(((e,t)=>{if(null===t)return this._model.dark().value();const i=(0,a.blendRgba)((0,a.parseRgba)(e),(0,a.parseRgba)(t));return"black"===(0,a.rgbToBlackWhiteString)([i[0],i[1],i[2]],150)}),this._model.backgroundColor().spawnOwnership(),this._createDataSourceBackgroundColorWV()),Promise.all([i.e(48263),i.e(23),i.e(28958),i.e(9168),i.e(81495)]).then(i.bind(i,158795)).then((t=>{this._cursorPaneView=new t.InplaceTextCursorPaneView(this,e),this._additionalCursorDataGetters&&(this._cursorPaneView.setAdditionalCursorData(...this._additionalCursorDataGetters),null!==this._cursorPosition&&(this._cursorPaneView.setCursorPosition(this._cursorPosition),e.updateSource(this)))}))}destroy(){this._isDarkBackground.destroy(),this._editableText.unsubscribe(),this._closeTextEditor(),super.destroy()}editableTextStyle(){return{...this._isDarkBackground.value()?m:v}}removeIfEditableTextIsEmpty(){return!1}activateEditingOnCreation(){return!1}topPaneViews(e){return this._activeEditingOwnerSource&&e.hasDataSource(this._activeEditingOwnerSource)&&!window.TradingView.printing&&this._cursorPaneView?(this._cursorPaneView.update((0,_.sourceChangeEvent)(this.id())),[this._cursorPaneView]):null}dataAndViewsReady(){return super.dataAndViewsReady()&&null!==this._cursorPaneView}editableText(){return this._editableText}textEditingEl(){return this._activateTextEditingEl}activateTextEditingOn(e,t){this._activateTextEditingEl=e,this._editingOnCreation=!!t,
this._editingActivationTime=performance.now(),this.updateAllViewsAndRedraw((0,_.sourceChangeEvent)(this.id()))}deactivateTextEditing(){this._closeTextEditor()}textEditingActivationTime(){return this._editingActivationTime}textEditingJustFinished(){return performance.now()-this._editingDeactivationTime<100}setAdditionalCursorData(e,t){this._cursorPaneView?this._cursorPaneView.setAdditionalCursorData(e,t):this._additionalCursorDataGetters=[e,t]}_updateAllPaneViews(e){super._updateAllPaneViews(e),this._cursorPaneView?.update(e)}async _openTextEditor(e,t,s,o,a){if(null!==this._container)return;null===this._editingActivationTime&&(this._editingActivationTime=performance.now()),this._activateTextEditingEl=null,this._cursorPosition=null,this._container=document.createElement("div"),this._container.style.position="absolute",this._container.style.top="0",this._container.style.bottom="0",this._container.style.left="0",this._container.style.right="0",this._container.style.overflow="hidden",this._container.style.pointerEvents="none",t.appendChild(this._container);const{updateChartEditorText:l,closeChartEditorText:d}=await Promise.all([i.e(7922),i.e(29365),i.e(50269)]).then(i.bind(i,946254));if(null===this._container||this._isDestroyed)return;this._activeEditingOwnerSource=e,this._closeChartEditorText=d;const{text:c,textColor:u,wordWrap:h}=this.editableTextProperties(),{forbidLineBreaks:p,maxLength:x}=this.editableTextStyle();this._editableText.setValue(c.value());const v=this.isFixed()?(0,n.ensureDefined)(this.fixedPoint(e)):(0,n.ensureNotNull)(this.pointToScreenPoint(this._points[0],e)),m={position:(0,r.point)(v.x,v.y),textInfo:s,placeholder:o,text:this._editableText,textColor:u,wordWrap:h,forbidLineBreaks:p,maxLength:x,onClose:a,onSelectionChange:this._onSelectionChange.bind(this),onContextMenu:this.onContextMenu?this.onContextMenu.bind(this):void 0};l(this._container,m),this.updateAllViewsAndRedraw((0,_.sourceChangeEvent)(this.id()))}_closeTextEditor(e){null===this._container||this._isDestroyed||(this._editingActivationTime=null,this._editingDeactivationTime=performance.now(),this._saveEditedText(),this._editingOnCreation=!1,this._onSelectionChange(),this._closeChartEditorText?.(this._container),this._closeChartEditorText=void 0,this._container.remove(),this._container=null,this._activeEditingOwnerSource=null,this.updateAllViewsAndRedraw((0,_.sourceChangeEvent)(this.id())))}_saveEditedText(){const e=this.editableTextProperties().text.value(),t=this._editableText.value();e!==t&&(this._editingOnCreation&&this.editableTextProperties().text.setValue(t),this._model.undoModel().undoHistory().pushUndoCommand(this._changeEditableTextUndoCommand(e,t)))}_changeEditableTextUndoCommand(e,t){return new g(this._model,this,e,t)}_createDataSourceBackgroundColorWV(){return new u.WatchedValue(null).readonly().ownership()}_onSelectionChange(e){if(null===this._container)return;const t={};if(void 0!==e){const{start:i,end:s}=e;i===s?t.cursorPosition=i:t.selectionRange=[Math.min(i,s),Math.max(i,s)]}(0,
s.default)(t,this._selectionData)||(this._selectionData=t,this._paneViews.forEach((e=>{e.forEach((e=>{"setSelectionRange"in e&&e.setSelectionRange(t.selectionRange)}))})),this._cursorPaneView?this._cursorPaneView.setCursorPosition(t.cursorPosition):this._cursorPosition=t.cursorPosition??null,this.updateAllViewsAndRedraw((0,_.sourceChangeEvent)(this.id())))}}},
750815: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolTrendBasedFibExtension: () => LineToolTrendBasedFibExtension });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolTrendBasedFibExtension extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolTrendBasedFibExtension.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[475630];
            const mod = i(475630);
            if (mod && mod.TrendBasedFibExtensionPaneView) {
              this._paneView = new mod.TrendBasedFibExtensionPaneView(this, this._model, this._openTextEditor.bind(this), this._closeTextEditor.bind(this));
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolTrendBasedFibExtension:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "TrendBasedFibExtension"; }
      levelsCount() { return 24; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetooltrendbasedfibextension",
          state: t,
          map: { range: [1, 24], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 24; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
340047: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibChannel: () => LineToolFibChannel });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibChannel extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibChannel.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[604414];
            const mod = i(604414);
            if (mod && mod.FibChannelPaneView) {
              this._paneView = new mod.FibChannelPaneView(this, this._model, this._openTextEditor.bind(this), this._closeTextEditor.bind(this));
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibChannel:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "FibChannel"; }
      levelsCount() { return 24; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibchannel",
          state: t,
          map: { range: [1, 24], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 24; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
35151: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibTimeZone: () => LineToolFibTimeZone });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibTimeZone extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibTimeZone.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[13886];
            const mod = i(13886);
            if (mod && mod.FibTimeZonePaneView) {
              this._paneView = new mod.FibTimeZonePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibTimeZone:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "FibTimeZone"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibtimezone",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
397679: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolTrendBasedFibTime: () => LineToolTrendBasedFibTime });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolTrendBasedFibTime extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolTrendBasedFibTime.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[682334];
            const mod = i(682334);
            if (mod && mod.TrendBasedFibTimePaneView) {
              this._paneView = new mod.TrendBasedFibTimePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolTrendBasedFibTime:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "TrendBasedFibTime"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetooltrendbasedfibtime",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
547575: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibCircles: () => LineToolFibCircles });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibCircles extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibCircles.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[16710];
            const mod = i(16710);
            if (mod && mod.FibCirclesPaneView) {
              this._paneView = new mod.FibCirclesPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibCircles:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "FibCircles"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibcircles",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
497897: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibWedge: () => LineToolFibWedge });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibWedge extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibWedge.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[431082];
            const mod = i(431082);
            if (mod && mod.FibWedgePaneView) {
              this._paneView = new mod.FibWedgePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibWedge:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "FibWedge"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibwedge",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
444143: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolGannSquare: () => LineToolGannSquare });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolGannSquare extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolGannSquare.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[242334];
            const mod = i(242334);
            if (mod && mod.GannSquarePaneView) {
              this._paneView = new mod.GannSquarePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolGannSquare:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "GannSquare"; }
      
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new def.DefaultProperty({ defaultName: "linetoolgannsquare", state: t, theme: e });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
499799: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolGannComplex: () => LineToolGannComplex });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolGannComplex extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolGannComplex.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[992806];
            const mod = i(992806);
            if (mod && mod.GannComplexPaneView) {
              this._paneView = new mod.GannComplexPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolGannComplex:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "GannComplex"; }
      
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new def.DefaultProperty({ defaultName: "linetoolganncomplex", state: t, theme: e });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
909427: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolGannFixed: () => LineToolGannFixed });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolGannFixed extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolGannFixed.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[403914];
            const mod = i(403914);
            if (mod && mod.GannFixedPaneView) {
              this._paneView = new mod.GannFixedPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolGannFixed:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "GannFixed"; }
      
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new def.DefaultProperty({ defaultName: "linetoolgannfixed", state: t, theme: e });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
449389: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolGannFan: () => LineToolGannFan });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolGannFan extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolGannFan.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[202664];
            const mod = i(202664);
            if (mod && mod.GannFanPaneView) {
              this._paneView = new mod.GannFanPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolGannFan:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "GannFan"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolgannfan",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
64743: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolPitchfork: () => LineToolPitchfork });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolPitchfork extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolPitchfork.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[604093];
            const mod = i(604093);
            if (mod && mod.PitchforkLinePaneView) {
              this._paneView = new mod.PitchforkLinePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolPitchfork:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "Pitchfork"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolpitchfork",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
659189: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolSchiffPitchfork: () => LineToolSchiffPitchfork });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolSchiffPitchfork extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolSchiffPitchfork.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[604093];
            const mod = i(604093);
            if (mod && mod.SchiffPitchforkLinePaneView) {
              this._paneView = new mod.SchiffPitchforkLinePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolSchiffPitchfork:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "SchiffPitchfork"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolschiffpitchfork",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
549455: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolSchiffPitchfork2: () => LineToolSchiffPitchfork2 });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolSchiffPitchfork2 extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolSchiffPitchfork2.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[604093];
            const mod = i(604093);
            if (mod && mod.SchiffPitchfork2LinePaneView) {
              this._paneView = new mod.SchiffPitchfork2LinePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolSchiffPitchfork2:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "SchiffPitchfork2"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolschiffpitchfork2",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
818799: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolInsidePitchfork: () => LineToolInsidePitchfork });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolInsidePitchfork extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolInsidePitchfork.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[604093];
            const mod = i(604093);
            if (mod && mod.InsidePitchforkLinePaneView) {
              this._paneView = new mod.InsidePitchforkLinePaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolInsidePitchfork:", err);
          }
        });
      }
      pointsCount() { return 3; }
      name() { return "InsidePitchfork"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolinsidepitchfork",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
792697: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolPitchfan: () => LineToolPitchfan });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolPitchfan extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolPitchfan.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[202664];
            const mod = i(202664);
            if (mod && mod.GannFanPaneView) {
              this._paneView = new mod.GannFanPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolPitchfan:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "Pitchfan"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolpitchfan",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
171414: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibSpeedResistanceFan: () => LineToolFibSpeedResistanceFan });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibSpeedResistanceFan extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibSpeedResistanceFan.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[202664];
            const mod = i(202664);
            if (mod && mod.GannFanPaneView) {
              this._paneView = new mod.GannFanPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibSpeedResistanceFan:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "FibSpeedResistanceFan"; }
      levelsCount() { return 9; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibspeedresistancefan",
          state: t,
          map: { range: [1, 9], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 9; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
485945: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibSpeedResistanceArcs: () => LineToolFibSpeedResistanceArcs });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibSpeedResistanceArcs extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibSpeedResistanceArcs.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[16710];
            const mod = i(16710);
            if (mod && mod.FibCirclesPaneView) {
              this._paneView = new mod.FibCirclesPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibSpeedResistanceArcs:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "FibSpeedResistanceArcs"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibspeedresistancearcs",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  },
796298: (e, t, i) => {
    i.r(t);
    i.d(t, { LineToolFibSpiral: () => LineToolFibSpiral });
    var r = i(172301), o = i(411227), a = i(617669), l = i(189819), d = i(956879), c = i(433979), def = i(760075);
    const u = new o.TranslatedString("erase level line", r.t(null, void 0, i(266775)));

    class LineToolFibSpiral extends c.LineToolFibWithInplaceTextBase {
      constructor(e, t, s, n) {
        super(e, t ?? LineToolFibSpiral.createProperties(e.backgroundTheme().spawnOwnership()), s, n);
        this.version = 2;
        Promise.all([i.e(81495)]).then(() => {
          try {
            delete i.c[16710];
            const mod = i(16710);
            if (mod && mod.FibCirclesPaneView) {
              this._paneView = new mod.FibCirclesPaneView(this, this._model);
              this._setPaneViews([this._paneView]);
              this.updateAllViews && this.updateAllViews();
              this._model && this._model.updateSource && this._model.updateSource(this);
              this._model && this._model.lightUpdate && this._model.lightUpdate();
            }
          } catch (err) {
            console.error("Error attaching pane view for LineToolFibSpiral:", err);
          }
        });
      }
      pointsCount() { return 2; }
      name() { return "FibSpiral"; }
      levelsCount() { return 11; }
      fibLevelsBasedOnLogScale() {
        return Boolean(this.properties().childs().fibLevelsBasedOnLogScale?.value() && this.priceScale()?.isLog?.());
      }
      static createProperties(e, t) {
        
        const p = new a.LevelsProperty({
          defaultName: "linetoolfibspiral",
          state: t,
          map: { range: [1, 11], names: ["coeff", "color", "visible", "text"] },
          theme: e
        });
        return this._configureProperties(p), p;
        
      }
      static _configureProperties(e) {
        super._configureProperties(e);
        const widths = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("linewidth")) widths.push(e.child("trendline").child("linewidth"));
        if (e.hasChild("levelsStyle") && e.child("levelsStyle").hasChild("linewidth")) widths.push(e.child("levelsStyle").child("linewidth"));
        if (e.hasChild("linewidth")) widths.push(e.child("linewidth"));
        const colors = [];
        if (e.hasChild("trendline") && e.child("trendline").hasChild("color")) colors.push(e.child("trendline").child("color"));
        if (e.hasChild("color")) colors.push(e.child("color"));
        
        for (let idx = 1; idx <= 11; idx++) {
          if (e.hasChild("level" + idx)) {
            const lvl = e.child("level" + idx);
            if (lvl.hasChild("color")) colors.push(lvl.child("color"));
            e.addExcludedKey("level" + idx + ".text", 1);
          }
        }
        
        if (!e.hasChild("linesColors")) e.addChild("linesColors", new d.LineToolColorsProperty(colors));
        if (!e.hasChild("linesWidths")) e.addChild("linesWidths", new d.LineToolWidthsProperty(widths));
      }
    }
  }
}]);
