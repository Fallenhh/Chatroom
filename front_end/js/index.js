/**
 *
 * Created by HouRuidong on 2016/7/29.
 */

var editComponentDetailBtn = $("#editComponentDetailBtn"), saveComponentDetailBtn = $("#saveComponentDetailBtn");
var editLabourDetailBtn = $("#editLabourDetailBtn"), saveLabourDetailBtn = $("#saveLabourDetailBtn");

var componentDetail2Disabled = $("#componentDetail select,#componentDetail input:not(#componentVersion),#componentDetail textarea,#componentDetail button:not(#editComponentDetailBtn,#saveComponentDetailBtn,.show-upload-document-modal)");
var labourDetail2Disabled = $("#labourDetail select,#labourDetail input:not(#labourVersion),#labourDetail textarea,#labourDetail button:not(#editLabourDetailBtn,#saveLabourDetailBtn,.show-upload-document-modal)");

var currentProductId,
    currentProductName;

var currentNodeId,
    currentParentNodeId,
    currentNodeSequence,
    currentNodeChildrenNumber,
    currentPeerNodeNumber,
    currentNodeTitle,
    currentNodeClassification,
    currentNodeTreeRootId;

var cutNodeId,
    copyNodeId;

var currentCategoryId,
    currentDocumentId;

var COMPONENT_CLASSIFICATION = 0,
    LABOUR_CLASSIFICATION = 1;

var PDD_AUTH = 1,
    OD_AUTH = 0;

var DOCUMENT_URL_PREFIX = "http://127.0.0.1/products/document/";

var TREE_KEY_EVENT_ACTIVE_STATUS = false;
//0-剪切，1-删除
var TREE_KEY_EVENT_OPERATION_FLAG;

$(function () {
    globalInit();
    getProductList();
    bindEvent();
});

function globalInit() {
    $(window).resize(function () {
        window.location.reload();
    });
    autoHandleContentHeight();
    autoHandleHorizontalPosition();
    validateEditor();
    componentDetail2Disabled.attr("disabled", true);
    labourDetail2Disabled.attr("disabled", true);
}

/*
 权限判定
 */
function validateEditor() {
    if (localStorage.authority == OD_AUTH) {
        $(".editor").hide();
    }
}
/*
 高度自适应
 */
function autoHandleContentHeight() {
    $("#content").height($("#container").height() - $("#header").height());
    $("#productList").height($("#content").height());
    $("#productTree").height($("#content").height());
    $("#productInfo").height($("#content").height());
    $("#productListContent").height($("#productList").height() - $("#productListHeader").height());
    $("#productTreeContent").height($("#productTree").height() - $("#productTreeHeader").height());
    $("#productInfoContent").height($("#productInfo").height() - $("#productInfoHeader").height());
}
//水平方向位置自适应
function autoHandleHorizontalPosition() {
    $('body').css('left', ($(window).width() - $('body').width()) / 2);
}

//----------------绑定事件----------------//
function bindEvent() {
    bindProductListEvent();
    bindNodeTreeEvent();
    bindEditAndSaveBtnEvent();
}
/*
 绑定产品列表事件
 */
function bindProductListEvent() {
        $("#addProductBtn").on('click', function () {
            emptyProductListHint();
            $('#newProductModal').modal('show');
        });
        $("#newProductBtn").on('click', newProduct);
        $('#editProductTitleBtn').on('click', editProductTitle);
        $('#editProductModelBtn').on('click', editProductModel);
        $('#deleteProductBtn').on('click', deleteProduct);
        //产品列表右键菜单事件
        $(function () {
            $.contextMenu({
                selector: '#productListTable tr',
                callback: function (key, options) {
                    switch (key) {
                        case "editTitle":
                            $('#editProductTitleModal').modal('show');
                            break;
                        case "editModel":
                            $('#editProductModelModal').modal('show');
                            break;
                        case "delete":
                            $('#deleteProductModal').modal('show');
                            break;
                    }
                },
                items: {
                    "editTitle": {name: "修改品名", icon: "edit"},
                    "editModel": {name: "修改型号", icon: "edit"},
                    "delete": {name: "删除产品", icon: "delete"}
                }
            });
        });
}
function bindNodeTreeEvent() {
    $("#newPeerNodeBtn").on("click", newPeerNode);
    $("#newSubNodeBtn").on("click", newSubNode);
    $("#newLabourBtn").on("click", newLabour);
    $("#renameNodeNameBtn").on("click", renameNode);
    $("#deleteNodeAndChildrenModalBtn").on("click", deleteNode);

    $("#generateBomBtn").on('click', function () {
        if ('block' == $('.save-detail').css('display')) {
            alert('请先保存产品信息');
        } else {
            generateBom();
        }
    });
    $("#releaseBomBtn").on("click", function () {
        if ('block' == $('.save-detail').css('display')) {
            alert('请先保存产品信息');
        } else {
            $('#releaseMsgModal').modal('show');
        }
    });
    $("#saveReleaseMsg").on("click", releaseProduct);
    $('#markBomModalBtn').on('click', generateBom);
    bindPddNodeContextMenuEvent();

    //绑定节点键盘事件
        key('ctrl+x', function () {
            if (TREE_KEY_EVENT_ACTIVE_STATUS == true) {
                var instance = $("#nodeTreeList").jstree(true);
                cutNodeId = currentNodeId;
                instance.delete_node(currentNodeId);
                TREE_KEY_EVENT_OPERATION_FLAG = 0;
                return false;
            }
        });
        key('ctrl+c', function () {
            if (TREE_KEY_EVENT_ACTIVE_STATUS == true) {
                copyNodeId = currentNodeId;
                TREE_KEY_EVENT_OPERATION_FLAG = 1;
                return false;
            }
        });
        key('ctrl+v', function () {
            if (TREE_KEY_EVENT_ACTIVE_STATUS == true) {
                if (TREE_KEY_EVENT_OPERATION_FLAG == 0) {
                    moveNode();
                } else if (TREE_KEY_EVENT_OPERATION_FLAG == 1) {
                    copyNode();
                }
                return false;
            }
        });

        key('delete',function () {
            if (currentNodeChildrenNumber == 0) {
                deleteNode();
            } else {
                $("#deleteNodeAndChildrenModal").modal("show");
            }
        })
}
/*
 绑定产品树事件
 */
/*
 绑定产品开发部产品树右键菜单事件
 */
function bindPddNodeContextMenuEvent() {
    $(function () {
        $.contextMenu({
            selector: '#nodeTreeList li',
            callback: function (key, options) {
                switch (key) {
                    case "newPeerNodeItem":
                        if (currentParentNodeId == "#") {
                            alert("不能在根节点新建同级节点");
                        } else {
                            $('#newPeerNodeModal').modal('show');
                        }
                        break;
                    case "newSubNodeItem":
                        if (currentNodeClassification == LABOUR_CLASSIFICATION) {
                            alert('不能在劳动下面新建下级节点');
                        } else if (currentNodeClassification == COMPONENT_CLASSIFICATION) {
                            $('#newSubNodeModal').modal('show');
                        }
                        break;
                    case "newLabourItem":
                        $('#newLabourModal').modal('show');
                        break;
                    case "showBomItem":
                        if (currentNodeClassification == LABOUR_CLASSIFICATION) {
                            alert("劳动节点无BOM");
                        } else {
                            validateIsBomList();
                        }
                        break;
                    case "showOdBomItem":
                        if (currentNodeClassification == LABOUR_CLASSIFICATION) {
                            alert("劳动节点无BOM");
                        } else {
                            localStorage.nodeId = currentNodeId;
                            localStorage.isPddBom = 0;
                            localStorage.isOdBom = 1;
                            window.location.assign('bom.html');
                        }
                        break;
                    case "renameNodeItem":
                        if (currentParentNodeId == "#") {
                            alert("不能重命名根节点");
                        } else {
                            $('#renameNodeModal').modal('show');
                        }
                        break;
                    case "deleteItem":
                        if (currentParentNodeId == "#") {
                            alert("不能删除根节点");
                        } else {
                            if (currentNodeChildrenNumber == 0) {
                                deleteNode();
                            } else {
                                $("#deleteNodeAndChildrenModal").modal("show");
                            }
                        }
                        break;
                }
            },
            items: {
                "newPeerNodeItem": {name: "新建同级", icon: "paste"},
                "newSubNodeItem": {name: "新建下级", icon: "paste"},
                "newLabourItem": {name: "新建劳动", icon: "paste"},
                "showBomItem": {name: "生产部BOM", icon: "copy"},
                "showOdBomItem": {name: "运营部BOM", icon: "copy"},
                "renameNodeItem": {name: "重命名", icon: "edit"},
                "deleteItem": {name: "删除", icon: "delete"}
            }
        });
    });
}
/*
 绑定运营部产品树右键菜单事件
 */
function bindOdNodeContextMenuEvent() {
    $(function () {
        $.contextMenu({
            selector: '#nodeTreeList li',
            callback: function (key, options) {
                switch (key) {
                    case "showBomItem":
                        if (currentNodeClassification == LABOUR_CLASSIFICATION) {
                            alert("劳动节点无BOM");
                        } else {
                            localStorage.nodeId = currentNodeId;
                            localStorage.isPddBom = 1;
                            localStorage.isOdBom = 0;
                            window.location.assign('bom.html');
                        }
                        break;
                    case "showOdBomItem":
                        if (currentNodeClassification == LABOUR_CLASSIFICATION) {
                            alert("劳动节点无BOM");
                        } else {
                            localStorage.nodeId = currentNodeId;
                            localStorage.isPddBom = 0;
                            localStorage.isOdBom = 1;
                            window.location.assign('bom.html');
                        }
                        break;
                }
            },
            items: {
                "showBomItem": {name: "生产部BOM", icon: "copy"},
                "showOdBomItem": {name: "运营部BOM", icon: "copy"}
            }
        });
    });
}
/*
 绑定产品信息事件
 */
function bindEditAndSaveBtnEvent() {
    editComponentDetailBtn.on("click", editComponentDetail);
    saveComponentDetailBtn.on("click", saveComponentDetail);
    editLabourDetailBtn.on("click", editLabourDetail);
    saveLabourDetailBtn.on("click", saveLabourDetail);
    //点击类型按钮的时候获取全部的类型
    $("#componentCategoryBtn").on("click", getCategoryChoices);
    $("#labourCategoryBtn").on("click", getCategoryChoices);

    //上传图号
    $("#upload-component-figure").on('click', uploadFigure);
    $("#upload-labour-figure").on('click', uploadFigure);
    //上传文档
    $(".show-upload-document-modal").on('click', function () {
        $('#uploadDocumentModal').modal('show');
    });
    $('#uploadDocumentModalBtn').on('click', uploadDocument);
    $('#replaceDocumentModalBtn').on('click', replaceDocument);
    $('#deleteDocumentModalBtn').on('click', deleteDocument);
}

//----------------产品列表js----------------//
/*
 获取产品列表
 */
function getProductList() {
    $.ajax({
        method: "GET",
        url: "/products/get-product-list",
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetProductListMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    })
}
/*
 处理“获取产品列表”返回的消息
 */
function dealGetProductListMsg(data) {
    if (data.code == 1) {
        generateProductListTable(data.data);
    } else {
        alert(data.msg);
        window.location.assign("login.html");
    }
}
/*
 将返回的产品列表JSON数据生成为Table
 */
function generateProductListTable(productList) {

    emptyProductListTable();

    for (var i = 0; i < productList.length; i++) {
        var id = productList[i].id,
            title = productList[i].title,
            model = productList[i].model;
        var $product = $('<tr><td>' + title + ' ' + model + '</td></tr>').attr('id', id);
        $("#productListTable").append($product);

        bindProductMouseDownEvent($product);
    }
}
/*
 将产品列表Table清空
 */
function emptyProductListTable() {
    var $productListTable = $('#productListTable');
    $productListTable.empty();
}
/*
 绑定产品列表鼠标左右键事件
 */
function bindProductMouseDownEvent($product) {
    $product.mousedown(function (e) {
        $('#productListTable').find('tr').css('background-color', '#48A6DA');
        switch (e.which) {
            case 1:
                if ('block' == $('.save-detail').css('display')) {
                    alert('请先保存产品信息');
                } else {
                    emptyProductListHint();
                    $(this).css('background-color', '#F5F5F5');
                    currentProductId = $(this)[0].id;
                    currentProductName = $(this)[0].textContent;
                    $("#nodeTreeName").html(currentProductName);
                    localStorage.bomName = currentProductName;
                    showProductTree(currentProductId);
                }
                break;
            case 3:
                if ('block' == $('.save-detail').css('display')) {
                    alert('请先保存产品信息');
                } else {
                    emptyProductListHint();
                    $(this).css('background-color', '#F5F5F5');
                    currentProductId = $(this)[0].id;
                    currentProductName = $(this)[0].textContent;
                    $("#nodeTreeName").html(currentProductName);
                    localStorage.bomName = currentProductName;
                    showProductTree(currentProductId);
                }
                break;
        }
    })
}
/*
 新建产品
 */
function newProduct() {
    var title = $('#inputNewProductTitle').val().trim();
    var model = $('#inputNewProductModel').val().trim();
    var reqJson = {
        title: title,
        model: model
    };

    $.ajax({
        method: "POST",
        url: "/products/add-product",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealNewProductMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealNewProductMsg(data) {
    if (data.code == 1) {
        $('#newProductModal').modal('hide');
        getProductList();
    } else {
        $('#newProductModalHint').html((data.msg));
    }
}
/*
 修改产品名称
 */
function editProductTitle() {
    var title = $('#inputEditProductTitle').val().trim();
    var reqJson = {
        id: currentProductId,
        title: title
    };

    $.ajax({
        method: "POST",
        url: "/products/update-product",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealEditProductTitleMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealEditProductTitleMsg(data) {
    if (data.code == 1) {
        $('#editProductTitleModal').modal('hide');
        getProductList();
    } else {
        $('#editProductTitleHint').html((data.msg));
    }
}
/*
 修改产品型号
 */
function editProductModel() {
    var model = $('#inputEditProductModel').val().trim();
    var reqJson = {
        id: currentProductId,
        model: model
    };

    $.ajax({
        method: "POST",
        url: "/products/update-product",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealEditProductModelMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealEditProductModelMsg(data) {
    if (data.code == 1) {
        alert("修改产品型号成功");
        $('#editProductModelModal').modal('hide');
        getProductList();
    } else {
        $('#editProductModelHint').html((data.msg));
    }
}
/*
 删除产品
 */
function deleteProduct() {
    var reqJson = {
        id: currentProductId
    };

    $.ajax({
        method: "POST",
        url: "/products/delete-product",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealDeleteProduct,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealDeleteProduct(data) {
    if (data.code == 1) {
        $('#deleteProductModal').modal('hide');
        emptyProductTree();
        getProductList();
    } else {
        $('#deleteProductHint').html((data.msg));
    }
}

function emptyProductListHint() {
    $(".productListModalHint").empty();
}
function emptyProductTree() {
    $("#nodeTreeName").empty();
    //销毁树
    $.jstree.destroy();
}

//----------------产品树js----------------//
/*
 向后端请求产品树的JSON数据
 */
function showProductTree(id) {
    //将之前的树销毁
    $.jstree.destroy();
    var reqJson = {
        "id": id
    };
    $.ajax({
        method: "POST",
        url: "/products/show-product-tree",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetNodeTreeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealGetNodeTreeMsg(data) {

    generateNodeTree(data.data);
}
/*
 生成产品树,每次加载完，将全部的节点展开
 param ：nodeTreeJson，产品树的JSON数据
 */
function generateNodeTree(nodeTreeJson) {
    currentNodeTreeRootId = nodeTreeJson.id;
    $('#nodeTreeList').jstree(
        {
            "core": {
                "data": nodeTreeJson,
                "check_callback": true
            },
            "plugins": ["dnd"]
        }
    ).on("select_node.jstree", function (e, data) {
        var instance = $("#nodeTreeList").jstree(true);
        if ('block' == $('.save-detail').css('display')) {
            alert('请先保存产品信息');
        } else {
            currentNodeId = data.selected[0];
            currentParentNodeId = instance.get_parent(currentNodeId);
            currentNodeChildrenNumber = instance.get_children_dom(currentNodeId).length;
            getCurrentNodeSequence(instance);
            currentNodeTitle = instance.get_json(currentNodeId).text;
            getNodeDetail();
            TREE_KEY_EVENT_ACTIVE_STATUS = true;
        }
    }).on("loaded.jstree", function () {
        var instance = $("#nodeTreeList").jstree(true);
        instance.open_all();
    });
}
/*
 得到当前节点序号
 */
function getCurrentNodeSequence(instance) {
    var $peerNodeList = instance.get_children_dom(currentParentNodeId);
    currentPeerNodeNumber = instance.get_children_dom(currentParentNodeId).length;

    for (var i = 0; i < currentPeerNodeNumber; i++) {
        if ($peerNodeList[i].id == currentNodeId) {
            currentNodeSequence = i;
        }
    }
}
/*
 新建同级节点
 */
function newPeerNode() {
    var title = $("#inputNewPeerNodeName").val().trim();
    var reqJson = {
        "parentId": currentParentNodeId,
        "title": title,
        "sequence": currentNodeSequence + 1,
        "classification": 0
    };
    $.ajax({
        method: "POST",
        url: "/products/new-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealNewNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
/*
 新建下级节点
 */
function newSubNode() {
    var title = $("#inputNewSubNodeName").val().trim();
    var reqJson = {
        "parentId": currentNodeId,
        "title": title,
        "sequence": currentNodeChildrenNumber,
        "classification": 0
    };
    $.ajax({
        method: "POST",
        url: "/products/new-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealNewNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
/*
 新建劳动
 */
function newLabour() {
    var title = $("#inputNewLabourName").val().trim();
    var reqJson = {
        "parentId": currentNodeId,
        "title": title,
        "sequence": currentNodeChildrenNumber,
        "classification": 1
    };
    $.ajax({
        method: "POST",
        url: "/products/new-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealNewNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealNewNodeMsg(data) {
    if (data.code == 1) {
        $('#newPeerNodeModal').modal('hide');
        $('#newSubNodeModal').modal('hide');
        $('#newLabourModal').modal('hide');
        showProductTree(currentProductId);
    } else {
        alert(data.msg);
    }
}
/*
 重命名节点
 */
function renameNode() {
    var title = $("#inputRenameNodeName").val().trim();
    var reqJson = {
        "id": currentNodeId,
        "title": title
    };
    $.ajax({
        method: "POST",
        url: "/products/rename-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealRenameNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealRenameNodeMsg(data) {
    if (data.code == 1) {
        $("#renameNodeModal").modal("hide");
        showProductTree(currentProductId);
    } else {
        alert(data.msg);
    }
}
/*
 删除节点
 */
function deleteNode() {
    $.ajax({
        method: "POST",
        url: "/products/delete-node",
        data: currentNodeId,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealDeleteNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealDeleteNodeMsg(data) {
    if (data.code == 1) {
        $("#deleteNodeAndChildrenModal").modal("hide");
        showProductTree(currentProductId);
    } else {
        alert(data.msg);
    }
}
function releaseProduct() {
    var releaseMsg = {
        prodId: currentProductId,
        releaseInfo: $("#releaseMsg").val()
    };
    $.ajax({
        method: "POST",
        url: "/products/release-product",
        data: JSON.stringify(releaseMsg),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealReleaseProductMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}

function dealReleaseProductMsg(data) {
    if (data.code == 1) {
        alert("发布成功");
        $('#releaseMsgModal').modal('hide');
    } else {
        alert(data.msg);
    }
}

function moveNode() {
    var reqJson = {
        movedId: cutNodeId,
        parentId: currentParentNodeId,
        sequence: currentNodeSequence + 1
    };

    $.ajax({
        method: "POST",
        url: "/products/move-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealMoveNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}

function dealMoveNodeMsg(data) {
    if (data.code == 1) {
        showProductTree(currentProductId);
    } else {
        alert(data.msg);
    }
}


function copyNode() {
    var reqJson = {
        movedId: copyNodeId,
        parentId: currentParentNodeId,
        sequence: currentNodeSequence + 1
    };

    $.ajax({
        method: "POST",
        url: "/products/copy-node",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealCopyNodeMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}

function dealCopyNodeMsg(data) {
    if (data.code == 1) {
        showProductTree(currentProductId);
    } else {
        alert(data.msg);
    }
}

//----------------产品信息----------------//
/*
 获得产品详细信息
 */
function getNodeDetail() {
    var reqJson = {
        id: currentNodeId
    };
    $.ajax({
        method: "GET",
        url: "/products/get-node-detail",
        data: reqJson,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetNodeDetailMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealGetNodeDetailMsg(data) {
    if (data.code == 1) {
        showDetailByClassification(data.data);
    } else {
        alert(data.msg);
    }
}
/*
 根据返回产品详细信息中的classification显示不同信息
 */
function showDetailByClassification(data) {
    showComponentDetail(data);
    // getDocumentList();
}
function showComponentDetail(data) {
    currentCategoryId = data.categoryId;
    $("#componentTitle").html(currentNodeTitle);
    $("#componentCategoryTitle").html(data.category);
    $("#componentSerialNumber").val(data.serialNumber);
    $("#componentChargePerson").val(data.chargePerson);
    $("#componentSupplier").val(data.supplier);
    $("#componentOriginalFactory").val(data.originalFactory);
    $("#componentUnitPrice").val(data.unitPrice);
    $("#componentAmount").val(data.amount);
    $("#componentStandard").val(data.standard);
    $("#componentVersion").val(data.version);
    $("#component-figure-title").html(data.figureNumber);
    $("#download-component-figure").attr('href', data.figure_url_prefix + data.figureNumber);
    $("#componentRemark").val(data.remark);
    $("#componentDetail").css("display", "block");
    $("#labourDetail").css("display", "none");
}
function showLabourDetail(data) {
    currentCategoryId = data.categoryId;
    $("#labourTitle").html(currentNodeTitle);
    $("#labourCategoryTitle").html(data.category);
    $("#labourChargePerson").val(data.chargePerson);
    $("#labourVersion").val(data.version);
    $("#labourCompany").val(data.company);
    $("#labourPrice").val(data.price);
    $("#labour-figure-title").html(data.figureNumber);
    $("#download-labour-figure").attr('href', data.figure_url_prefix + data.figureNumber);
    $("#labourRemark").val(data.remark);
    $("#componentDetail").css("display", "none");
    $("#labourDetail").css("display", "block");
}

function editComponentDetail() {
    TREE_KEY_EVENT_ACTIVE_STATUS = false;
    componentDetail2Disabled.attr("disabled", false);
    editComponentDetailBtn.css("display", "none");
    saveComponentDetailBtn.css("display", "block");
}
function saveComponentDetail() {
    TREE_KEY_EVENT_ACTIVE_STATUS = true;
    updateComponentInfo();
    componentDetail2Disabled.attr("disabled", true);
    saveComponentDetailBtn.css("display", "none");
    editComponentDetailBtn.css("display", "block");
}
function editLabourDetail() {
    TREE_KEY_EVENT_ACTIVE_STATUS = false;
    labourDetail2Disabled.attr("disabled", false);
    editLabourDetailBtn.css("display", "none");
    saveLabourDetailBtn.css("display", "block");
}
function saveLabourDetail() {
    TREE_KEY_EVENT_ACTIVE_STATUS = true;
    updateLabourInfo();
    labourDetail2Disabled.attr("disabled", true);
    saveLabourDetailBtn.css("display", "none");
    editLabourDetailBtn.css("display", "block");
}

/*
 获得节点类别
 */
function getCategoryChoices() {
    var reqJson = {
        classification: currentNodeClassification
    };
    $.ajax({
        method: "GET",
        url: "/products/get-category-choices",
        data: reqJson,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetCategoryChoices,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealGetCategoryChoices(data) {
    if (data.code == 1) {
        emptyCategorySelect();
        var cateList = data.data;
        if (currentNodeClassification == 0) {
            generateComponentCategorySelect(cateList);
        } else if (currentNodeClassification == 1) {
            generateLabourCategorySelect(cateList);
        }
    } else {
        alert(data.msg);
    }
}
/*
 生成组件类别下拉框
 */
function generateComponentCategorySelect(cateList) {
    var $componentCategoryMenu = $("#componentCategoryMenu");

    for (var i = 0; i < cateList.length; i++) {
        var cateId = cateList[i].id;
        var cateTitle = cateList[i].title;
        var $componentCategoryOption = $("<li><a href='#'>" + cateTitle + "</a></li>").attr('id', cateId).attr('title', cateTitle);
        $componentCategoryMenu.append($componentCategoryOption);
        $componentCategoryOption.on("click", function () {
            currentCategoryId = $(this)[0].id;
            $("#componentCategoryTitle").html($(this)[0].title);
        })
    }
    var $editComponentCategoryOption = $("<li id='editComponentCategoryOption'><a href='#'>" + "<span class='glyphicon glyphicon-pencil' aria-hidden='true'></span>" + "编辑类别" + "</a></li>");
    $componentCategoryMenu.append($editComponentCategoryOption);
    $editComponentCategoryOption.on("click", function () {
        $("#editComponentCategoryModal").modal('show');
        getCategoryChoices2();
    })
}
/*
 生成劳动类别下拉框
 */
function generateLabourCategorySelect(cateList) {
    var $labourCategoryMenu = $("#labourCategoryMenu");
    for (var i = 0; i < cateList.length; i++) {
        var cateId = cateList[i].id;
        var cateTitle = cateList[i].title;
        var $labourCategoryOption = $("<li><a href='#'>" + cateTitle + "</a></li>").attr("id", cateId).attr('title', cateTitle);
        $labourCategoryMenu.append($labourCategoryOption);
        $labourCategoryOption.on("click", function () {
            currentCategoryId = $(this)[0].id;
            $("#labourCategoryTitle").html($(this)[0].title);
        })
    }
}
/*
 清除类别下拉框
 */
function emptyCategorySelect() {
    $("#componentCategoryMenu").empty();
    $("#labourCategoryMenu").empty();
}
/*
 保存组件信息
 */
function updateComponentInfo() {
    var reqJson = {
        amount: $("#componentAmount").val().trim(),
        id: currentNodeId,
        standard: $("#componentStandard").val().trim(),
        remark: $("#componentRemark").val().trim(),
        chargePerson: $("#componentChargePerson").val().trim(),
        serialNumber: $("#componentSerialNumber").val().trim(),
        unitPrice: $("#componentUnitPrice").val().trim(),
        originalFactory: $("#componentOriginalFactory").val().trim(),
        supplier: $("#componentSupplier").val().trim(),
        cateId: currentCategoryId,
        figureNumber: $("#component-figure-title").html().trim()
    };

    $.ajax({
        method: "POST",
        url: "/products/update-component-info",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealUpdateComponentInfoMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealUpdateComponentInfoMsg(data) {
    if (data.code == 1) {
    } else {
        alert(data.msg);
    }
}

/*
 保存劳动信息
 */
function updateLabourInfo() {
    var reqJson = {
        id: currentNodeId,
        price: $("#labourPrice").val().trim(),
        remark: $("#labourRemark").val().trim(),
        company: $("#labourCompany").val().trim(),
        chargePerson: $("#labourChargePerson").val().trim(),
        cateId: currentCategoryId,
        figureNumber: $("#labour-figure-title").html().trim()
    };

    $.ajax({
        method: "POST",
        url: "/products/update-labour-info",
        data: JSON.stringify(reqJson),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealUpdateLabourInfoMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealUpdateLabourInfoMsg(data) {
    if (data.code == 1) {
    } else {
        alert(data.msg);
    }
}

var nodeIdsForBom = new Array();

/*
 生成生产部BOM
 */
function generateBom() {
    //每次点击生成生产部BOM将之前的id数组清零
    nodeIdsForBom = new Array();
    findNodeIdsForBom(currentNodeTreeRootId);
    $.ajax({
        method: "POST",
        url: "/products/remark-isbom",
        data: JSON.stringify(nodeIdsForBom),
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGenerateBomMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
/*
 递归查找当前显示的节点id
 */
function findNodeIdsForBom(nodeId) {
    nodeIdsForBom.push(nodeId);
    var instance = $("#nodeTreeList").jstree(true);
    if (instance.is_open(nodeId) == true) {
        var childrenList = instance.get_node(nodeId).children;
        for (var i = 0; i < childrenList.length; i++) {
            findNodeIdsForBom(childrenList[i]);
        }
    }
}
function dealGenerateBomMsg(data) {
    if (data.code == 1) {
        alert("标记为生产部BOM成功");
        $('#markBomModal').modal('hide');
    } else {
        alert(data.msg);
    }
}

/*
 向后端请求类别并生成组件类别按钮
 */
function getCategoryChoices2() {
    var reqJson = {
        classification: currentNodeClassification
    };
    $.ajax({
        method: "GET",
        url: "/products/get-category-choices",
        data: reqJson,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetCategoryChoices2,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}
function dealGetCategoryChoices2(data) {
    if (data.code == 1) {
        emptyCategorySelect();
        var cateList = data.data;
        if (currentNodeClassification == 0) {
            generateComponentCategorySelect2(cateList);
        }
    } else {
        alert(data.msg);
    }
}

function generateComponentCategorySelect2(cateList) {
    var $catesForm = $("#catesForm");
    $catesForm.empty();
    for (var i = 0; i < cateList.length; i++) {
        var cateId = cateList[i].id;
        var cateTitle = cateList[i].title;
        var $componentCategoryOption = $("<button><font size='3' face='微软雅黑'>" + cateTitle + "</font></button>").attr('id', cateId).attr('title', cateTitle).attr('class', 'cateOptions');
        $(function () {
            $componentCategoryOption.contextmenu(function (e) {
                if (e && e.preventDefault) {
                    e.preventDefault();
                } else {
                    window.event.returnValue = false;
                }
                $("#deleteCateName").text($(this).text());
                $("#renameCateName").text($(this).text());
            });
        });
        $catesForm.append($componentCategoryOption);
    }
//绑定种类列表事件
    $(function () {
        $.contextMenu({
            selector: '#catesForm button',
            callback: function (key, options) {
                switch (key) {
                    case "renameCates":
                        $('#renameCategoryModal').modal('show');
                        break;
                    case "deleteCate":
                        $('#deleteComponentCategoryModal').modal('show');
                        break;
                }
            },
            items: {
                "renameCates": {name: "重命名", icon: "edit"},
                "deleteCate": {name: "删除该类", icon: "delete"}
            }
        });
    });
}


/*
 上传图号
 */
function uploadFigure() {
    var formData = new FormData();
    formData.append('nodeId', currentNodeId);
    if (currentNodeClassification == COMPONENT_CLASSIFICATION) {
        formData.append('file', $('#component-figure')[0].files[0]);
    } else if (currentNodeClassification == LABOUR_CLASSIFICATION) {
        formData.append('file', $('#labour-figure')[0].files[0]);
    }
    $.ajax({
            url: '/products/upload-figure',
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            success: dealUploadFigureMsg,
            error: function () {
                alert("未连接至服务器，请联系管理员！");
            }
        }
    );
}

function dealUploadFigureMsg(data) {
    if (data.code == 1) {
        if (currentNodeClassification == COMPONENT_CLASSIFICATION) {
            $("#component-figure-title").html(data.data.figureNumber);
            $("#download-component-figure").attr('href', data.data.figure_url_prefix + data.data.figureNumber);
        } else if (currentNodeClassification == LABOUR_CLASSIFICATION) {
            $("#labour-figure-title").html(data.data.figureNumber);
            $("#download-labour-figure").attr('href', data.data.figure_url_prefix + data.data.figureNumber);
        }
    } else {
        alert(data.msg);
    }
}

/*
 获取文档列表
 */
function getDocumentList() {
    var reqJson = {
        nodeId: currentNodeId
    };
    $.ajax({
        method: "GET",
        url: "/products/get-document-list",
        data: reqJson,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealGetDocumentListMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}

function dealGetDocumentListMsg(respData) {
    if (respData.code == 1) {
        generateDocumentList(respData.data.documentList);
    }
}

/*
 生成文档列表
 */
function generateDocumentList(documentList) {
    var $componentDocumentList = $("#component-document-list");
    var $labourDocumentList = $("#labour-document-list");

    $componentDocumentList.find('tr').not('.document-list-top').remove();
    $labourDocumentList.find('tr').not('.document-list-top').remove();

    if (currentNodeClassification == COMPONENT_CLASSIFICATION) {
        for (var i = 0; i < documentList.length; i++) {
            var documentTitle = documentList[i].title;
            var documentSerialNumber = currentNodeTitle + " -" + documentList[i].sequence;
            var documentId = documentList[i].id;
            var documentUrl = DOCUMENT_URL_PREFIX + documentList[i].title;

            var $componentDocument = $('<tr><td><div><p class="text-center">' + documentTitle + '</p></div></td>' +
                '<td><div><p class="text-center">' + documentSerialNumber + '</p></div></td>' +
                '<td><div style="text-align: center;"><a class="download-document btn btn-success" href="#" role="button" download><span class="glyphicon glyphicon-download"></span></a>' +
                '<button type="button" class="replace-document editor btn btn-primary" aria-label="refresh"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>' +
                '<button type="button" class="delete-document editor btn btn-danger" aria-label="remove"><span class="delete-document glyphicon glyphicon-remove" aria-hidden="true"></span></button></div></td></tr>');
            $componentDocument.find('.download-document').attr('href', documentUrl);
            $componentDocument.find('.replace-document').attr('id', documentId).on('click', function () {
                $("#replaceDocumentModal").modal('show');
                currentDocumentId = $(this)[0].id;
            });
            $componentDocument.find('.delete-document').attr('id', documentId).on('click', function () {
                $('#deleteDocumentModal').modal('show');
                currentDocumentId = $(this)[0].id;
            });
            $componentDocumentList.append($componentDocument);
            validateEditor();
        }
    } else if (currentNodeClassification == LABOUR_CLASSIFICATION) {
        for (var i = 0; i < documentList.length; i++) {
            var documentTitle = documentList[i].title;
            var documentSerialNumber = currentNodeTitle + " -" + documentList[i].sequence;
            var documentId = documentList[i].id;
            var documentUrl = DOCUMENT_URL_PREFIX + documentList[i].title;

            var $labourDocument = $('<tr><td><div><p class="text-center">' + documentTitle + '</p></div></td>' +
                '<td><div><p class="text-center">' + documentSerialNumber + '</p></div></td>' +
                '<td><div style="text-align: center;"><a class="download-document btn btn-success" href="#" role="button" download><span class="glyphicon glyphicon-download"></span></a>' +
                '<button type="button" class="replace-document editor btn btn-primary" aria-label="refresh"><span class="glyphicon glyphicon-refresh" aria-hidden="true"></span></button>' +
                '<button type="button" class="delete-document editor btn btn-danger" aria-label="remove"><span class="delete-document glyphicon glyphicon-remove" aria-hidden="true"></span></button></div></td></tr>');
            $labourDocument.find('.download-document').attr('href', documentUrl);
            $labourDocument.find('.replace-document').attr('id', documentId).on('click', function () {
                $("#replaceDocumentModal").modal('show');
                currentDocumentId = $(this)[0].id;
            });
            $labourDocument.find('.delete-document').attr('id', documentId).on('click', function () {
                $('#deleteDocumentModal').modal('show');
                currentDocumentId = $(this)[0].id;
            });
            $labourDocumentList.append($labourDocument);
            validateEditor();
        }
    }
}

/*
 上传文档
 */
function uploadDocument() {
    var formData = new FormData();
    formData.append('nodeId', currentNodeId);
    formData.append('file', $('#document')[0].files[0]);
    $.ajax({
            url: '/products/upload-document',
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            success: dealUploadDocumentMsg,
            error: function () {
                alert("未连接至服务器，请联系管理员！");
            }
        }
    );
}

function dealUploadDocumentMsg(data) {
    if (data.code == 1) {
        alert("上传文档成功！");
        $('#uploadDocumentModal').modal('hide');
        getDocumentList();
    } else {
        alert(data.msg);
    }
}

/*
 替换文档
 */
function replaceDocument() {
    var formData = new FormData();
    formData.append('docId', currentDocumentId);
    formData.append('file', $('#document-replace')[0].files[0]);
    $.ajax({
            url: '/products/replace-document',
            type: 'POST',
            cache: false,
            data: formData,
            processData: false,
            contentType: false,
            success: dealReplaceDocumentMsg,
            error: function () {
                alert("未连接至服务器，请联系管理员！");
            }
        }
    );
}

function dealReplaceDocumentMsg(data) {
    if (data.code == 1) {
        alert("替换文档成功！");
        $('#replaceDocumentModal').modal('hide');
        getDocumentList();
    } else {
        alert(data.msg);
    }
}

/*
 删除文档
 */
function deleteDocument() {

    var reqJson = {
        docId: currentDocumentId
    };
    $.ajax({
        method: "GET",
        url: "/products/delete-document",
        data: reqJson,
        contentType: "application/json;charset=utf-8",
        cache: false,
        success: dealDeleteDocumentMsg,
        error: function () {
            alert("未连接至服务器，请联系管理员！");
        }
    });
}

function dealDeleteDocumentMsg(data) {
    if (data.code == 1) {
        alert("删除文档成功！");
        $('#deleteDocumentModal').modal('hide');
        getDocumentList();
    } else {
        alert(data.msg);
    }
}

function validateIsBomList() {
    var reqJson = {
        id: currentNodeId
    };
    $.ajax({
        method: "POST",
        url: "/products/show-bom",
        data: reqJson,
        dataType: "json",
        cache: false,
        success: function (data) {
            if (data.code == 1) {
                localStorage.nodeId = currentNodeId;
                localStorage.isPddBom = 1;
                localStorage.isOdBom = 0;
                window.location.assign('bom.html');
            } else if (data.code == -302) {
                alert(data.msg);
                window.location.assign("login.html");
            } else if (data.code == -310) {
                $('#markBomModal').modal('show');
                alert(data.msg);
                return false;
            }
        },
        error: function () {
            alert("未连接至服务器，请联系管理员！:获取Bom信息失败");
        }
    });
}

