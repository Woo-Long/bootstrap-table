# bootstrap-table
基于bootstrap样式编写的jquery table插件

# 如何使用？
1.在`body`元素里添加引用
``` html
<script src="/js/bootstrap-talbe.js">
```
2.在`srcipt`元素里使用`table`函数
``` js
$("#table").table({
    url: '/', // 你的url地址
    dataType: "json", // 目前版本仅支持json格式
    pageIndex: 1, // 当前页码
    pageCount: 10, // 每页显示的条数
    pageAlign: "right", // 分页显示的位置“left、center（默认）、right”
    isMultiSelect: true, // 是否支持checkbox，默认为false
    params: [
        { name: "自定参数名", value: "自定义参数的值" }
    ],
    colModel: [
        {
            display: "测试列", name: "ProcessName", width: 140, formatText: function (data) {
                // 自定义列内容，存在 `formatText` 配置会忽略 `name`
                var html = '<a href="' + data.ApproveUrl + '"  target="_blank">' + data.ProcessName + '</a>';
                return html;
            }
        }
    ],
    onRowClick: function (row) {
        console.log(row)
    },
    onSuccess: function (data) {
        console.log(data);
    }
});
```
