﻿define(['embyRouter', 'alert', 'loading', 'pluginManager', 'appSettings', 'baseView', 'emby-textarea', 'emby-scroller', 'emby-select'], function (embyRouter, alert, loading, pluginManager, appSettings, BaseView) {

    function onSubmit(e) {
        e.preventDefault();
        return false;
    }

    function quit(view) {
        view.querySelector(`#txtCustomJS_Csscontent`).remove();
    }

    function renderSettings(settingview) {
        //初始化代码编辑器
        function initEditor(type) {
            //获取控件
            let editor = ace.edit(`txtCustomJS_Csscontent`);
            //设置风格和语言（更多风格和语言，请到github上相应目录查看）
            let rootStyle = getComputedStyle(document.documentElement);
            let colorNow = rootStyle.getPropertyValue('--theme-accent-text-color').toString();
            let colorLight = rootStyle.getPropertyValue('--theme-accent-text-color-lightbg').toString();
            let colorDark = rootStyle.getPropertyValue('--theme-accent-text-color-darkbg').toString();
            let theme;
            if (colorNow.includes(colorDark)) {
                theme = "one_dark";
            } else if (colorNow.includes(colorLight)) {
                theme = "xcode";
            } else {
                theme = "xcode";
            }
            editor.setTheme(`ace/theme/${theme}`);
            //语言
            let language;
            switch (type) {
                case "JS":
                    language = "javascript";
                    break;
                case "Css":
                    language = "css";
                    break;
                default:
                    language = "javascript";
                    break;
            }
            editor.session.setMode(`ace/mode/${language}`);
            //字体大小
            editor.setFontSize(15);
            //设置只读（true时只读，用于展示代码）
            editor.setReadOnly(false);
            //自动换行,设置为off关闭
            editor.setOption("wrap", "free");
            //启用提示菜单
            editor.setOptions({
                fontFamily: "Consolas, Monaco, monospace",
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true,
            });
            // 去掉打印线
            editor.setShowPrintMargin(false);
            return editor;
        }

        function format() {
            beautify.beautify(editor.session)
        }

        function save(){
            let custom_settings = appSettings.get(`Custom${type}`);
            custom_settings = custom_settings ? JSON.parse(custom_settings) : {};
            if (name && custom_settings.hasOwnProperty(name)) {
                delete custom_settings[name];
            }
            let name_new = view.querySelector(`#txtCustomJS_Cssname`).value;
            if (!name_new) {
                alert("请输入名称");
                return;
            }
            if (custom_settings.name) {
                alert(`${name_new}已存在，请重新输入`);
                return;
            }
            let annotations = editor.getSession().getAnnotations();
            for (let i = 0; i < annotations.length; i++) {
                let annotation = annotations[i];
                if (annotation.type === "error") {
                    alert("代码有误，请检查");
                    return;
                }
            }
            custom_settings[encodeURIComponent(name_new)] = {
                content: editor.getValue(),
                date: new Date().toLocaleString(),
                enabled: view.querySelector(`#txtCustomJS_Cssenabled`).value
            };
            editor.destroy();
            appSettings.set(`Custom${type}`, JSON.stringify(custom_settings));
            let url = pluginManager.mapRoute(
                        "customjs_css",
                        "customjs_css.html"
                    );
            embyRouter.show(url);
        }

        let beautify = ace.require("ace/ext/beautify");
        let view = settingview.view;
        // 清空
        view.querySelector(`#txtCustomJS_Csscontent`).innerHTML = "";
        let params = settingview.params;
        let type = params.type || "JS";
        let name = params.name ? encodeURIComponent(params.name) : "";
        let content = " ";
        let enabled = "0";
        if (name) {
            let custom_settings = appSettings.get(`Custom${type}`);
            if (custom_settings) {
                custom_settings = JSON.parse(custom_settings);
                if (custom_settings.hasOwnProperty(name)) {
                    content = custom_settings[name].content;
                    enabled = custom_settings[name].enabled;
                }
            }
        }
        view.querySelector(`#txtCustomJS_Cssname`).value = decodeURIComponent(name);
        view.querySelector(`#txtCustomJS_Cssenabled`).value = enabled;
        let editor = initEditor(type);
        if (content) {
            editor.setValue(content);
        }
        view.querySelector(`#btnCustomJS_Csssave`).addEventListener("click", function () {
            save();
        });
        view.querySelector(`#btnCustomJS_Cssformat`).addEventListener("click", function () {
            format();
        });

    }

    function SettingsView(view, params) {

        BaseView.apply(this, arguments);

        view.querySelector('form').addEventListener('submit', onSubmit);

    }

    Object.assign(SettingsView.prototype, BaseView.prototype);

    SettingsView.prototype.onResume = function (options) {

        BaseView.prototype.onResume.apply(this, arguments);

        loading.hide();

        if (options.refresh) {
            renderSettings(this);
        }
    };

    SettingsView.prototype.onPause = function () {

        BaseView.prototype.onPause.apply(this, arguments);

        quit(this.view);
    };

    return SettingsView;
});