/**
 * @fileoverview Utility functions for SynthBlockly Stage.
 * Shared between main UI and generators.
 */

window.SB_Utils = window.SB_Utils || {};

/**
 * --- Blockly API Polyfills (v12 to v13 compatibility) ---
 */
window.SB_Utils.initPolyfills = function() {
    if (Blockly.Workspace.prototype.getAllVariables === undefined) {
        Blockly.Workspace.prototype.getAllVariables = function() {
            return this.getVariableMap().getAllVariables();
        };
    }
    if (Blockly.Workspace.prototype.getVariable === undefined) {
        Blockly.Workspace.prototype.getVariable = function(name, opt_type) {
            return this.getVariableMap().getVariable(name, opt_type);
        };
    }
    if (Blockly.Workspace.prototype.getVariableById === undefined) {
        Blockly.Workspace.prototype.getVariableById = function(id) {
            return this.getVariableMap().getVariableById(id);
        };
    }
};

/**
 * --- Key Management System ---
 */
window.SB_Utils.KEYS = {
    // 系統保留：移調與還原，使用者絕對不能自訂
    SYSTEM: ['up', 'down', 'left', 'right', '+', '-', 'backspace'],
    // 鋼琴音階：當舞台積木存在時，這些鍵被佔用
    PIANO: ['q', '2', 'w', '3', 'e', 'r', '5', 't', '6', 'y', '7', 'u', 'i', '9', 'o', '0', 'p'],
    // 完整可用清單 (排除系統鍵)
    ALL: 'abcdefghijklmnopqrstuvwxyz1234567890[]\;,./'.split('')
};

/**
 * 動態計算目前可用的按鍵列表
 * @param {Blockly.Block} currentBlock 當前積木 (用以排除自己佔用的鍵)
 * @returns {Array} [[label, value], ...]
 */
window.SB_Utils.getAvailableKeys = function(currentBlock) {
    const workspace = currentBlock.workspace;
    const hasStage = workspace.getAllBlocks(false).some(b => b.type === 'visual_stage_setup');
    
    // 找出其他積木已經佔用的鍵
    const occupiedKeys = new Set();
    workspace.getAllBlocks(false).forEach(b => {
        if (b !== currentBlock && (b.type === 'ui_key_event' || b.type === 'ui_key_pressed')) {
            const val = b.getFieldValue('KEY');
            if (val) occupiedKeys.add(val.toLowerCase());
        }
    });

    const options = [];
    window.SB_Utils.KEYS.ALL.forEach(k => {
        const isPiano = window.SB_Utils.KEYS.PIANO.includes(k);
        const isOccupied = occupiedKeys.has(k);
        const isSystem = window.SB_Utils.KEYS.SYSTEM.includes(k);

        if (isSystem) return; // 系統鍵永不出現

        let label = k.toUpperCase();
        if (hasStage && isPiano) return; // 有舞台時，鋼琴鍵不出現
        if (isOccupied) return; // 已被其他積木佔用，不出現

        options.push([label, k]);
    });

    return options.length > 0 ? options : [['(無可用按鍵)', 'NONE']];
};

/**
 * 全域檢查衝突並標記警告
 */
window.SB_Utils.checkKeyConflicts = function(workspace) {
    const hasStage = workspace.getAllBlocks(false).some(b => b.type === 'visual_stage_setup');
    const usedKeys = new Map();

    workspace.getAllBlocks(false).forEach(b => {
        if (b.type === 'ui_key_event' || b.type === 'ui_key_pressed') {
            const k = b.getFieldValue('KEY');
            if (!k) return;
            
            const isPiano = window.SB_Utils.KEYS.PIANO.includes(k.toLowerCase());
            
            if (hasStage && isPiano) {
                b.setWarningText(Blockly.Msg['SB_KEY_CONFLICT_STAGE'] || "此按鍵已分配給「舞台鋼琴」功能，此積木將失效。");
                b.setFieldValue(Blockly.Msg['SB_LABEL_CONFLICT_STAGE'] || " [！已被舞台鋼琴佔用]", "CONFLICT_LABEL");
                const svg = b.getSvgRoot();
                if (svg) {
                    svg.classList.add('blockly-conflict-glow');
                    const labelField = b.getField("CONFLICT_LABEL");
                    if (labelField && labelField.getSvgRoot()) {
                        labelField.getSvgRoot().classList.add('blockly-conflict-text');
                    }
                }
                if (typeof b.setDisabled === 'function') b.setDisabled(true);
            } else if (usedKeys.has(k.toLowerCase())) {
                b.setWarningText(Blockly.Msg['SB_KEY_CONFLICT_DUP'] || "此按鍵已被另一個積木重複定義。");
                b.setFieldValue(Blockly.Msg['SB_LABEL_CONFLICT_DUP'] || " [！按鍵衝突]", "CONFLICT_LABEL");
                const svg = b.getSvgRoot();
                if (svg) {
                    svg.classList.add('blockly-conflict-glow');
                    const labelField = b.getField("CONFLICT_LABEL");
                    if (labelField && labelField.getSvgRoot()) {
                        labelField.getSvgRoot().classList.add('blockly-conflict-text');
                    }
                }
                if (typeof b.setDisabled === 'function') b.setDisabled(true);
            } else {
                b.setWarningText(null);
                b.setFieldValue("", "CONFLICT_LABEL");
                const svg = b.getSvgRoot();
                if (svg) {
                    svg.classList.remove('blockly-conflict-glow');
                }
                if (typeof b.setDisabled === 'function') b.setDisabled(false);
                usedKeys.set(k.toLowerCase(), b);
            }
        }
    });
};

/**
 * --- Orphan Block System ---
 */
window.SB_Utils.VALID_ROOTS = [
    'processing_setup',
    'processing_draw',
    'processing_exit',
    'ui_key_event',
    'sb_perform',
    'sb_tone_loop',
    'sb_instrument_container',
    'sb_define_chord',
    'sb_serial_data_received',
    'midi_on_note',
    'midi_off_note',
    'midi_on_controller_change',
    'procedures_defnoreturn',
    'procedures_defreturn',
    'sb_comment'
];

window.SB_Utils.updateOrphanBlocks = function(ws) {
    if (!ws || ws.isDragging()) return;

    Blockly.Events.setGroup(true);
    try {
        const topBlocks = ws.getTopBlocks(false);
        topBlocks.forEach(topBlock => {
            const isOrphan = !window.SB_Utils.VALID_ROOTS.includes(topBlock.type);
            
            topBlock.getDescendants(false).forEach(block => {
                const hasOrphanReason = block.hasDisabledReason('orphan');
                if (hasOrphanReason !== isOrphan) {
                    block.setDisabledReason(isOrphan, 'orphan');
                }
            });
        });
    } finally {
        Blockly.Events.setGroup(false);
    }
};

/**
 * --- Generator Helpers ---
 */

/**
 * 將積木上的樂器文字轉換為 Java 代碼中的變數或字串
 */
window.SB_Utils.getInstrumentJavaName = function(name) {
    const currentLabel = Blockly.Msg['SB_CURRENT_INSTRUMENT_OPTION'] || '當前選用的樂器';
    const promptLabel = Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT'] || '(請選擇樂器)';
    if (!name || name === currentLabel || name === promptLabel) {
        return 'currentInstrument';
    }
    return '"' + name + '"';
};

/**
 * 輔助函數：計算相對索引 (0-based)
 * @param {string} atCode 代碼字串
 * @returns {string} 轉換後的代碼字串
 */
window.SB_Utils.getRelativeIndex = function(atCode) {
    if (!atCode) atCode = '1';
    // Use native JS check for numeric string
    if (!isNaN(parseFloat(atCode)) && isFinite(atCode)) {
        return String(Number(atCode) - 1);
    }
    return atCode + ' - 1';
};

/**
 * --- Audio Block Shared Helpers ---
 */

// Mixin to trigger updateShape on field change (used by samplers and effects)
window.SB_Utils.FIELD_HELPER = {
    onchange: function (e) {
        if (!this.workspace || this.isInFlyout) return;
        if (e.type === Blockly.Events.BLOCK_CHANGE && e.blockId === this.id && 
           (e.name === 'PATH' || e.name === 'TYPE' || e.name === 'EFFECT_TYPE')) {
            this.updateShape_(e.newValue);
        }
    }
};

/**
 * DYNAMIC DROPDOWN FOR INSTRUMENTS
 */
window.SB_Utils.getInstrumentOptions = function () {
    const options = [];
    const currentLabel = Blockly.Msg['SB_CURRENT_INSTRUMENT_OPTION'] || '當前選用的樂器';
    options.push([currentLabel, currentLabel]);

    const workspace = Blockly.getMainWorkspace();
    if (workspace) {
        const blocks = workspace.getBlocksByType('sb_instrument_container');
        for (let block of blocks) {
            const name = block.getFieldValue('NAME');
            if (name) options.push([name, name]);
        }
    }
    return options;
};

/**
 * 輔助函式：將文字輸入框轉化為具備下拉選單功能的組件
 */
window.SB_Utils.createInstrumentField = function (defaultVal) {
    const field = new Blockly.FieldTextInput(defaultVal || (Blockly.Msg['SB_CURRENT_INSTRUMENT_OPTION'] || ''));

    field.showEditor_ = function (opt_e) {
        setTimeout(() => {
            const options = window.SB_Utils.getInstrumentOptions();
            const menu = options.map(opt => ({
                text: opt[0],
                enabled: true,
                callback: () => { field.setValue(opt[1]); }
            }));
            menu.push({
                text: "--- " + (Blockly.Msg['AUDIO_SAMPLER_CUSTOM'] || "手動輸入") + " ---",
                enabled: true,
                callback: () => { Blockly.FieldTextInput.prototype.showEditor_.call(field); }
            });
            Blockly.ContextMenu.show(opt_e || {}, menu, this.sourceBlock_.RTL);
        }, 10);
    };
    return field;
};

/**
 * DYNAMIC DROPDOWN FOR CHORDS
 */
window.SB_Utils.getChordDropdown = function () {
    const chordBlocks = Blockly.getMainWorkspace().getBlocksByType('sb_define_chord');
    const options = [];
    for (let block of chordBlocks) {
        const name = block.getFieldValue('NAME');
        if (name) {
            options.push([name, name]);
        }
    }
    if (options.length === 0) {
        options.push([Blockly.Msg['AUDIO_SELECT_CHORD_DROPDOWN'] || '(選取和弦)', 'none']);
    }
    return options;
};

// Global Aliases for compatibility
window.SB_KEYS = window.SB_Utils.KEYS;
window.getAvailableKeys = window.SB_Utils.getAvailableKeys;
window.checkKeyConflicts = window.SB_Utils.checkKeyConflicts;
window.updateOrphanBlocks = window.SB_Utils.updateOrphanBlocks;
window.createInstrumentField = window.SB_Utils.createInstrumentField;
window.getChordDropdown = window.SB_Utils.getChordDropdown;

/**
 * --- Audio Mutators ---
 */

window.SB_Utils.HARMONIC_PARTIALS_MUTATOR = {
    itemCount_: 3,
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('sb_harmonic_partial_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('sb_harmonic_partial_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getNextBlock();
        this.itemCount_ = 0;
        while (itemBlock) {
            this.itemCount_++;
            itemBlock = itemBlock.getNextBlock();
        }
        this.updateShape_();
    },
    updateShape_: function () {
        const connections = [];
        for (let i = 1; i <= 100; i++) {
            const input = this.getInput('PARTIAL' + i);
            if (!input) break;
            connections.push(input.connection.targetConnection);
        }
        let i = 1;
        while (this.getInput('PARTIAL' + i)) {
            this.removeInput('PARTIAL' + i);
            i++;
        }
        for (let i = 1; i <= this.itemCount_; i++) {
            const input = this.appendValueInput('PARTIAL' + i)
                .setCheck('Number')
                .appendField(Blockly.Msg['AUDIO_HARMONIC_FIELD'].replace('%1', i));
            if (connections[i - 1]) {
                input.connection.connect(connections[i - 1]);
            }
        }
    }
};

window.SB_Utils.ADDITIVE_SYNTH_MUTATOR = {
    itemCount_: 2,
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('sb_additive_synth_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('sb_additive_synth_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getNextBlock();
        this.itemCount_ = 0;
        while (itemBlock) {
            this.itemCount_++;
            itemBlock = itemBlock.getNextBlock();
        }
        this.updateShape_();
    },
    updateShape_: function () {
        const fieldValues = [];
        for (let i = 1; i <= 100; i++) {
            if (!this.getField('WAVE' + i)) break;
            fieldValues.push({
                wave: this.getFieldValue('WAVE' + i),
                ratio: this.getFieldValue('RATIO' + i),
                amp: this.getFieldValue('AMP' + i)
            });
        }
        let i = 1;
        while (this.getInput('COMP' + i)) { this.removeInput('COMP' + i); i++; }
        for (let i = 1; i <= this.itemCount_; i++) {
            this.appendDummyInput('COMP' + i)
                .appendField("波形")
                .appendField(new Blockly.FieldDropdown([["Triangle", "TRIANGLE"], ["Sine", "SINE"], ["Square", "SQUARE"], ["Saw", "SAW"]]), "WAVE" + i)
                .appendField("倍率")
                .appendField(new Blockly.FieldTextInput("1.0"), "RATIO" + i)
                .appendField("振幅")
                .appendField(new Blockly.FieldTextInput("0.5"), "AMP" + i);
            if (fieldValues[i - 1]) {
                this.setFieldValue(fieldValues[i - 1].wave, 'WAVE' + i);
                this.setFieldValue(fieldValues[i - 1].ratio, 'RATIO' + i);
                this.setFieldValue(fieldValues[i - 1].amp, 'AMP' + i);
            }
        }
    }
};

window.SB_Utils.DRUM_SAMPLER_MUTATOR = {
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('type', this.getFieldValue('PATH') || 'Kick');
        return container;
    },
    domToMutation: function (xmlElement) {
        this.updateShape_(xmlElement.getAttribute('type') || 'Kick');
    },
    updateShape_: function (type) {
        const inputExists = this.getInput('CUSTOM_PATH');
        if (type === 'CUSTOM') {
            if (!inputExists) {
                this.appendDummyInput('CUSTOM_PATH')
                    .appendField(Blockly.Msg['AUDIO_SAMPLER_PATH_FIELD'] || "路徑")
                    .appendField(new Blockly.FieldTextInput("drum/kick.wav"), "CUSTOM_PATH_VALUE");
            }
        } else {
            if (inputExists) {
                this.removeInput('CUSTOM_PATH');
            }
        }
    }
};

window.SB_Utils.MELODIC_SAMPLER_MUTATOR = {
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('type', this.getFieldValue('TYPE') || 'PIANO');
        return container;
    },
    domToMutation: function (xmlElement) {
        this.updateShape_(xmlElement.getAttribute('type') || 'PIANO');
    },
    updateShape_: function (type) {
        const inputExists = this.getInput('CUSTOM_PATH');
        if (type === 'CUSTOM') {
            if (!inputExists) {
                this.appendDummyInput('CUSTOM_PATH')
                    .appendField(Blockly.Msg['AUDIO_SAMPLER_PATH_FIELD'] || "路徑")
                    .appendField(new Blockly.FieldTextInput("piano"), "CUSTOM_PATH_VALUE");
            }
        } else {
            if (inputExists) {
                this.removeInput('CUSTOM_PATH');
            }
        }
    }
};

window.SB_Utils.RHYTHM_V2_MUTATOR = {
    itemCount_: 1,
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('items', this.itemCount_);
        return container;
    },
    domToMutation: function (xmlElement) {
        this.itemCount_ = parseInt(xmlElement.getAttribute('items'), 10);
        this.updateShape_();
    },
    decompose: function (workspace) {
        const containerBlock = workspace.newBlock('sb_rhythm_v2_container');
        containerBlock.initSvg();
        let connection = containerBlock.nextConnection;
        for (let i = 0; i < this.itemCount_; i++) {
            const itemBlock = workspace.newBlock('sb_rhythm_v2_item');
            itemBlock.initSvg();
            connection.connect(itemBlock.previousConnection);
            connection = itemBlock.nextConnection;
        }
        return containerBlock;
    },
    compose: function (containerBlock) {
        let itemBlock = containerBlock.getNextBlock();
        this.itemCount_ = 0;
        while (itemBlock) {
            this.itemCount_++;
            itemBlock = itemBlock.getNextBlock();
        }
        this.updateShape_();
    },
    updateShape_: function () {
        const trackData = [];
        for (let i = 0; i < 50; i++) {
            if (!this.getField('INST' + i)) break;
            trackData.push({
                inst: this.getFieldValue('INST' + i),
                vel: this.getFieldValue('VEL' + i),
                mode: this.getFieldValue('MODE' + i),
                pattern: this.getFieldValue('PATTERN' + i)
            });
        }
        let i = 0;
        while (this.getInput('TRACK' + i)) { this.removeInput('TRACK' + i); i++; }
        for (let i = 0; i < this.itemCount_; i++) {
            const input = this.appendDummyInput('TRACK' + i)
                .appendField("樂器")
                .appendField(window.SB_Utils.createInstrumentField(Blockly.Msg['SB_SELECT_INSTRUMENT_PROMPT']), 'INST' + i)
                .appendField("力度")
                .appendField(new Blockly.FieldTextInput("100"), 'VEL' + i)
                .appendField("模式")
                .appendField(new Blockly.FieldDropdown([["單音", "FALSE"], ["和弦", "TRUE"]]), 'MODE' + i)
                .appendField("節奏")
                .appendField(new Blockly.FieldTextInput("x--- x--- x--- x---"), 'PATTERN' + i);
            if (trackData[i]) {
                this.setFieldValue(trackData[i].inst, 'INST' + i);
                this.setFieldValue(trackData[i].vel, 'VEL' + i);
                this.setFieldValue(trackData[i].mode, 'MODE' + i);
                this.setFieldValue(trackData[i].pattern, 'PATTERN' + i);
            }
        }
    }
};

window.SB_Utils.SETUP_EFFECT_MUTATOR = {
    mutationToDom: function () {
        const container = Blockly.utils.xml.createElement('mutation');
        container.setAttribute('effect_type', this.getFieldValue('EFFECT_TYPE') || 'filter');
        if (this.getFieldValue('EFFECT_TYPE') === 'filter') {
            container.setAttribute('filter_type_value', this.getFieldValue('FILTER_TYPE_VALUE') || 'lowpass');
            container.setAttribute('filter_rolloff_value', this.getFieldValue('FILTER_ROLLOFF_VALUE') || '-12');
        }
        return container;
    },
    domToMutation: function (xmlElement) {
        this.updateShape_(xmlElement.getAttribute('effect_type') || 'filter', xmlElement);
    },
    updateShape_: function (type, xmlElement) {
        const params = [
            'FILTER_TYPE', 'FILTER_FREQ', 'FILTER_Q', 'FILTER_ROLLOFF',
            'DELAY_TIME', 'FEEDBACK',
            'BITDEPTH',
            'THRESHOLD', 'RATIO', 'ATTACK', 'RELEASE', 'MAKEUP',
            'WET', 'DISTORTION_AMOUNT', 'DECAY', 'PREDELAY',
            'RATE', 'DEPTH', 'MOD_TYPE', 'SWEEP_INPUT', 'SWEEP_DEPTH_INPUT', 'JITTER_INPUT',
            'ROOMSIZE', 'DAMPING'
        ];
        params.forEach(p => { if (this.getInput(p)) this.removeInput(p); });

        const addShadow = (inputName, num) => {
            const input = this.getInput(inputName);
            if (input && input.connection && !xmlElement) {
                const shadow = Blockly.utils.xml.textToDom(
                    '<shadow type="math_number"><field name="NUM">' + num + '</field></shadow>'
                );
                input.connection.setShadowDom(shadow);
            }
        };

        if (type === 'filter') {
            this.appendDummyInput('FILTER_TYPE').setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_FILTER_INTERNAL_TYPE_FIELD'])
                .appendField(new Blockly.FieldDropdown([["lowpass", "lowpass"], ["highpass", "highpass"], ["bandpass", "bandpass"]]), "FILTER_TYPE_VALUE");
            this.appendValueInput('FILTER_FREQ').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_FILTER_FREQ_FIELD']);
            this.appendValueInput('FILTER_Q').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD']);
            this.appendDummyInput('FILTER_ROLLOFF').setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_ROLLOFF_FIELD'])
                .appendField(new Blockly.FieldDropdown([["-12dB", "-12"], ["-24dB", "-24"], ["-48dB", "-48"]]), "FILTER_ROLLOFF_VALUE");

            addShadow('FILTER_FREQ', 1000);
            addShadow('FILTER_Q', 0.5);

            if (xmlElement) {
                this.setFieldValue(xmlElement.getAttribute('filter_type_value') || 'lowpass', 'FILTER_TYPE_VALUE');
                this.setFieldValue(xmlElement.getAttribute('filter_rolloff_value') || '-12', 'FILTER_ROLLOFF_VALUE');
            }
        } else if (type === 'delay') {
            this.appendValueInput('DELAY_TIME').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD']);
            this.appendValueInput('FEEDBACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD']);
            addShadow('DELAY_TIME', 0.5); addShadow('FEEDBACK', 0.5);
        } else if (type === 'bitcrush') {
            this.appendValueInput('BITDEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_BITDEPTH_FIELD']);
            addShadow('BITDEPTH', 8);
        } else if (type === 'waveshaper') {
            this.appendValueInput('DISTORTION_AMOUNT').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_DISTORTION_AMOUNT_FIELD']);
            addShadow('DISTORTION_AMOUNT', 2);
        } else if (type === 'reverb') {
            this.appendValueInput('ROOMSIZE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_ROOMSIZE_FIELD']);
            this.appendValueInput('DAMPING').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_DAMPING_FIELD']);
            this.appendValueInput('WET').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_WET_FIELD']);
            addShadow('ROOMSIZE', 0.5); addShadow('DAMPING', 0.5); addShadow('WET', 0.3);
        } else if (type === 'flanger') {
            this.appendValueInput('DELAY_TIME').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_DELAY_TIME_FIELD']);
            this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
            this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
            this.appendValueInput('FEEDBACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_FEEDBACK_FIELD']);
            addShadow('DELAY_TIME', 1); addShadow('RATE', 0.5); addShadow('DEPTH', 1); addShadow('FEEDBACK', 0.5);
        } else if (type === 'compressor') {
            this.appendValueInput('THRESHOLD').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD']);
            this.appendValueInput('RATIO').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RATIO_FIELD']);
            this.appendValueInput('ATTACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_ATTACK_FIELD']);
            this.appendValueInput('RELEASE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RELEASE_FIELD']);
            this.appendValueInput('MAKEUP').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_MAKEUP_FIELD']);
            addShadow('THRESHOLD', -20); addShadow('RATIO', 4); addShadow('ATTACK', 0.01); addShadow('RELEASE', 0.25); addShadow('MAKEUP', 0);
        } else if (type === 'limiter') {
            this.appendValueInput('THRESHOLD').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_THRESHOLD_FIELD']);
            this.appendValueInput('ATTACK').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_ATTACK_FIELD']);
            this.appendValueInput('RELEASE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RELEASE_FIELD']);
            addShadow('THRESHOLD', -3); addShadow('ATTACK', 0.001); addShadow('RELEASE', 0.1);
        } else if (type === 'autofilter') {
            this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
            this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
            this.appendValueInput('FILTER_Q').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_FILTER_Q_FIELD']);
            addShadow('RATE', 0.5); addShadow('DEPTH', 20); addShadow('FILTER_Q', 0.4);
        } else if (type === 'pitchmod') {
            this.appendDummyInput('MOD_TYPE').setAlign(Blockly.ALIGN_RIGHT)
                .appendField(Blockly.Msg['SB_EFFECT_MOD_TYPE_FIELD'])
                .appendField(new Blockly.FieldDropdown([
                    [Blockly.Msg['SB_EFFECT_MOD_TYPE_JITTER'] || "Jitter", "NOISE"],
                    [Blockly.Msg['SB_EFFECT_MOD_TYPE_VIBRATO'] || "Vibrato", "SINE"]
                ]), "TYPE");
            this.appendValueInput('RATE').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_RATE_FIELD']);
            this.appendValueInput('DEPTH').setCheck("Number").setAlign(Blockly.ALIGN_RIGHT).appendField(Blockly.Msg['SB_EFFECT_DEPTH_FIELD']);
            addShadow('RATE', 5); addShadow('DEPTH', 10);
        }
    }
};
