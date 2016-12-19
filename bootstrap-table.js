/*$
* ===================================================================================
* bootstrap-table
* author:Jason (Long.Woo)
* https://github.com/woo-long/bootstrap-table
* ===================================================================================
*
* 使用 
* 服务端返回json格式
* {"status":true,"content":[],"total":0,"message":"加载动态成功"}
* ===================================================================================
*/

(function ($) {

    String.format = function () {
        var str = arguments[0];
        for (var i = 1; i < arguments.length; i++) {
            str = str.replace(RegExp("\\{" + (i - 1) + "\\}", "gm"), arguments[i]);
        }
        return str;
    };

    var TABLE = {
        // 初始化
        init: function (o) {
            return this.each(function () {
                $.initgrid(this, o);
            });
        },

        // 获取选中行
        getSelectRows: function () {
            var $rows = $(this).find("tbody tr.tb-select-row");
            return $rows;
        },

        // 获取选中行数据
        getSelectRowsData: function () {
            var $rows = $(this).find("tbody tr.tb-select-row"),
                rowdatas = [];

            $.each($rows, function (i, o) {
                rowdatas.push($(o).data("rowdata"));
            });

            return rowdatas;
        }
    }

    $.extend({
        initgrid: function (g, p) {
            p = $.extend({
                url: false,
                method: 'POST',
                dataType: 'json',
                colModel: [],
                pageIndex: 1,
                pageCount: 10,
                params: [], // 参数 “{name:"p1",value:"1"}”
                autoload: true,
                showHead: true, // 是否显示表头 
                showPager: true, // 是否分页显示，非前端实现
                isMultiSelect: false, // 是否多选，默认单选
                emptymsg: '未找到匹配项', // 无数据结果是
                awaitmsg: '请稍后...', // 请求时，显示的消息
                pageAlign: 'center', // 分页水平显示位置。left、center（默认）、right
                isPageGoto: true, // 是否显示分页跳转
                onSuccess: false, // 成功事件
                onError: false, // 错误事件
                onComplete: false, // 完成事件
                onSelectChange: false, // 行选择更改事件
                onRowClick: false, // 行单击事件
                onCustomContent: false, // 自定义内容事件
                emptyContentTemp: '',
                scrollLoad: false // 滚动加载
            }, p);

            var option = {
                // 选择全部行
                fullSelect: function () {
                    $(g).on("change", ".j-chk-all", function (e) {
                        if ($(this).is(":checked")) {
                            $(g).find(".j-chk-item").prop("checked", true);
                        }
                        else {
                            $(g).find(".j-chk-item").prop("checked", false);
                        }

                        e.stopImmediatePropagation();
                    });
                },
                // 行单击事件
                rowClick: function (count) {
                    $(g).unbind("click"); // 移除click事件
                    
                    $(g).on("click", "tbody tr", function (e) {
                        var $rowChk = $(this).find(".j-chk-item");

                        if (!p.isMultiSelect) { // 如果是单选
                            $(g).find("tr.tb-select-row").removeClass("tb-select-row");
                            $(this).addClass("tb-select-row");
                            $rowChk.prop("checked", true);
                        }
                        else {
                            if ($(this).hasClass("tb-select-row")) { // 多选情况下，在同一行上重复单击
                                $(this).removeClass("tb-select-row");
                                $rowChk.prop("checked", false);
                            }
                            else {
                                $(this).addClass("tb-select-row");
                                $rowChk.prop("checked", true);
                            }

                            // 选中数大于等于每页行数
                            if ($(g).find(".j-chk-item:checked").size() >= count) {
                                $(g).find(".j-chk-all").prop("checked", true);
                            }
                            else {
                                $(g).find(".j-chk-all").prop("checked", false);
                            }
                        }

                        if (p.onRowClick) {
                            p.onRowClick(this);
                        }
                        
                        if (e.target.nodeName == "LABEL") return false;

                        e.stopImmediatePropagation();
                    });
                },
                gotopager: function (pageIndex) {
                    option.loadData(pageIndex);
                },
                bindPagerItem: function (pageIndex, total) {
                    var $jpager = $(g).next('.jpager'),
                        pageNumber = Math.ceil(total / p.pageCount);

                    $(g).find(".j-chk-all").prop("checked", false); // 移除选中
                    $jpager.remove();

                    if (pageNumber > 1 && $(g).next().html() == null) {
                        $(g).after(option.initPager());
                        $jpager = $(g).next('.jpager');
                    }

                    if (!p.scrollLoad) {
                        var pageItems = 6,
                        startIndex = Math.ceil(pageIndex - (pageItems / 2));

                        if (startIndex + pageItems > pageNumber)
                            startIndex = pageNumber + 1 - pageItems;
                        if (startIndex < 1)
                            startIndex = 1;
                        var endIndex = startIndex + pageItems - 1; //pageNumber
                        if (endIndex > pageNumber)
                            endIndex = pageNumber;
                        $jpager.find(".btngroup").empty();

                        if (startIndex > 1) {
                            $jpager.find(".btngroup").append('<button type="button" data-page="' + (startIndex - 1) + '" class="btn btn-sm btn-default"><i class="glyphicon">&middot;&middot;&middot;</i></button>');
                        }

                        // 分页按钮
                        for (var i = startIndex; i <= endIndex; i++) {
                            if (i == pageIndex) {
                                $jpager.find(".btngroup").append('<button type="button" class="btn btn-sm btn-primary">' + i + '</button>');
                            } else {
                                $jpager.find(".btngroup").append('<button type="button" data-page="' + i + '" class="btn btn-sm btn-default">' + i + '</button>');
                            }
                        }

                        if (endIndex < pageNumber) {
                            $jpager.find(".btngroup").append('<button type="button" data-page="' + (endIndex + 1) + '" class="btn btn-sm btn-default"><i class="glyphicon">&middot;&middot;&middot;</i></button>');
                        }

                        $jpager.find(".btngroup button[data-page]").click(function () {
                            option.gotopager($(this).data("page"));
                        });

                        // 分页下拉
                        var opItem = "",
                            isSelected = '';
                        for (var i = 1; i <= pageNumber; i++) {
                            isSelected = i == pageIndex ? 'selected="selected"' : '';
                            opItem += '<option value="' + i + '" ' + isSelected + '>' + i + '</option>';
                        }
                        $jpager.find(".page-index-box").html(opItem);

                        $jpager.find(".page-index-box").on("change", function () {
                            option.gotopager($(this).val());
                        });

                        if (pageIndex <= 1) {
                            $jpager.find(".firstbtn, .prevbtn").addClass("disabled");
                        } else {
                            $jpager.find(".firstbtn, .prevbtn").removeClass("disabled");
                            $jpager.find(".firstbtn").click(function (event) {
                                option.gotopager(1);

                                event.stopImmediatePropagation();
                            });
                            $jpager.find(".prevbtn").click(function (event) {
                                option.gotopager(pageIndex - 1);

                                event.stopImmediatePropagation();
                            });
                        }
                        if (pageIndex == pageNumber) {
                            $jpager.find(".nextbtn, .lastbtn").addClass("disabled");
                        } else {
                            $jpager.find(".nextbtn, .lastbtn").removeClass("disabled");
                            $jpager.find(".nextbtn").click(function (event) {
                                option.gotopager(pageIndex + 1);

                                event.stopImmediatePropagation();
                            });
                            $jpager.find(".lastbtn").click(function (event) {
                                option.gotopager(pageNumber);

                                event.stopImmediatePropagation();
                            });
                        }
                    }
                    else {
                        $(document).scroll(function (event) {

                            if ($(g).hasClass('active')) {
                                var scroolHeight = $(document).height() - $(window).height();
                                if ($(this).scrollTop() == scroolHeight) {
                                    option.gotopager(pageIndex + 1);
                                }
                            }

                            event.stopImmediatePropagation();
                        });
                    }
                },
                initPager: function () {
                    var pageLayout = '<div class="row text-' + p.pageAlign + ' jpager">';

                    if (!p.scrollLoad) {
                        var colsm = p.isPageGoto ? "col-sm-10" : "col-sm-12";

                        pageLayout += '<div class="' + colsm + '">';
                        pageLayout += '<div class="btn-group" role="group" aria-label="group">';
                        pageLayout += '<div class="btn-toolbar" role="toolbar" aria-label="Pager items button groups">';
                        pageLayout += '<div class="btn-group" role="group" aria-label="First prev group">';
                        pageLayout += '<a class="btn btn-sm btn-default firstbtn"><i class="glyphicon glyphicon-fast-backward"></i></a>';
                        pageLayout += '<a class="btn btn-sm btn-default prevbtn"><i class="glyphicon glyphicon-backward"></i></a>';
                        pageLayout += '</div>';
                        pageLayout += '<div class="btn-group btngroup" role="group" aria-label="Numeric pager items group"></div>';
                        pageLayout += '<div class="btn-group" role="group" aria-label="Last next group">';
                        pageLayout += '<a class="btn btn-sm btn-default nextbtn"><i class="glyphicon glyphicon-forward"></i></a>';
                        pageLayout += '<a class="btn btn-sm btn-default lastbtn"><i class="glyphicon glyphicon-fast-forward"></i></a>';
                        pageLayout += '</div>';
                        pageLayout += '</div>';
                        pageLayout += '</div>';
                        pageLayout += '</div>';

                        if (p.isPageGoto) {
                            pageLayout += '<div class="col-sm-2">';
                            pageLayout += '<div class="input-group">';
                            pageLayout += '<span class="input-group-addon">转到第</span>';
                            pageLayout += '<select class="form-control input-sm page-index-box"></select>';
                            pageLayout += '<span class="input-group-addon">页</span>';
                            pageLayout += '</div>';
                        }

                        pageLayout += '</div>';
                    }

                    pageLayout += '</div>';

                    return pageLayout;
                },
                bindData: function (data, pageIndex) {
                    if (p.dataType == 'json') {
                        if (!p.onCustomContent) {
                            $(g).children('tbody').remove();
                            var tbody = document.createElement('tbody'),
                                tr = "",
                                td = "";

                            if (data.status && data.content) {
                                $.each(data.content, function (i, o) {
                                    tr = document.createElement('tr');

                                    if (p.isMultiSelect) { // 为每行添加checkbox
                                        var tableId = $(g).attr("id");
                                        tr = document.createElement('tr');
                                        td = document.createElement('td');

                                        td.innerHTML = '<div class="checkbox"><input type="checkbox" class="j-chk-item" id="' + tableId + '_chk_item_' + i + '" /></div>';
                                        $(td).css('text-align', 'center');

                                        $(tr).html(td);
                                    }

                                    for (var c = 0; c < p.colModel.length; c++) {
                                        var cm = p.colModel[c],
                                            tdalign = cm.align == undefined ? 'left' : cm.align;

                                        td = document.createElement('td');
                                        $(td).css('text-align', tdalign);

                                        if (cm.name != "action" && cm.object == undefined) {
                                            td.innerHTML = o[cm.name] == null ? "" : o[cm.name];
                                        }

                                        if (cm.object) {
                                            td.innerHTML = o[cm.object][cm.name];
                                        }

                                        if (cm.formatText) {
                                            td.innerHTML = cm.formatText(o);
                                        }
                                        $(tr).append(td).data("rowdata", o);
                                    }
                                    $(tbody).append(tr);
                                });

                                option.rowClick(data.content.length);
                                option.fullSelect();
                            }
                            else { // 服务器返回空数据
                                tr = document.createElement('tr'),
                                td = document.createElement('td');

                                td.innerHTML = !(data.message) ? p.emptymsg : data.message;
                                td.colSpan = p.isMultiSelect ? (p.colModel.length + 1) : p.colModel.length;
                                td.className = "text-center";

                                $(tr).append(td);
                                $(tbody).append(tr);
                            }
                            $(g).append(tbody);
                        }
                        else {
                            if (!p.showHead) {
                                $(g).empty();
                            }
                            var content = '';

                            if (data.status) {
                                $.each(data.content, function (i, o) {
                                    content += p.onCustomContent(o);
                                });
                            }
                            else {
                                if (p.emptyContentTemp != '') {
                                    content = p.emptyContentTemp;
                                }
                            }

                            $(g).append(content);
                        }

                        if (p.showPager) {
                            option.bindPagerItem(pageIndex, data.total);
                        }
                    }
                },
                loadData: function (pageIndex) {
                    if (!p.url) {
                        return false;
                    }
                    if (!pageIndex) {
                        pageIndex = p.pageIndex;
                    }
                    var param = [
                        { name: 'pageIndex', value: pageIndex },
                        { name: 'pageCount', value: p.pageCount }
                    ];
                    if (p.params.length) {
                        for (var i = 0; i < p.params.length; i++) {
                            param[param.length] = p.params[i];
                        }
                    }
                    $.ajax({
                        type: p.method,
                        url: p.url,
                        data: param,
                        dataType: p.dataType,
                        beforeSend: function () {
                            //$(g).html(p.awaitmsg);
                        },
                        success: function (data) {
                            option.bindData(data, pageIndex);
                            if (p.onSuccess) p.onSuccess(data);
                        },
                        error: function (xhr, status, msg) {
                            if (p.onError) p.onError(xhr, status, msg);
                        },
                        complete: function (xhr, status) {
                            if (p.onComplete) p.onComplete(xhr, status);
                        }
                    });
                }
            };

            if (p.colModel && p.showHead) {//初始化表头列
                var thead = document.createElement('thead'),
                    tr = document.createElement('tr'),
                    th = "";

                // 添加checkbox
                if (p.isMultiSelect) {
                    var tableId = $(g).attr("id");
                    th = document.createElement('th');
                    th.innerHTML = '<div class="checkbox"><input type="checkbox" class="j-chk-all" id="' + tableId + '_chk_all" /></div>';
                    $(th).css('text-align', 'center');
                    $(th).css('width', "20px");
                    $(tr).html(th);
                }

                for (var i = 0; i < p.colModel.length; i++) {
                    var cm = p.colModel[i];
                    th = document.createElement('th');

                    if (cm.display != undefined) {
                        th.innerHTML = cm.display;
                    }
                    if (cm.name) {
                        $(th).attr("field", cm.name);
                    }
                    if (cm.align) {
                        $(th).css('text-align', cm.align);
                    }
                    if (cm.width) {
                        $(th).css('width', cm.width + "px");
                    }

                    $(tr).append(th);
                }
                $(thead).append(tr);
                $(g).html(thead);
            }

            if (p.autoload) {
                option.loadData();
            }
        }
    });

    $.fn.table = function () {
        var method = arguments[0];

        if (TABLE[method]) {
            method = TABLE[method];
            arguments = Array.prototype.slice.call(arguments, 1);
        } else if (typeof (method) == 'object' || !method) {
            method = TABLE.init;
        } else {
            $.error('Method ' + method + ' does not exist on Bootstrap-table.');
            return this;
        }

        return method.apply(this, arguments);

    };
})(jQuery);
