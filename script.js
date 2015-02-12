(function ($) {
// Global Default Settings
var _extension = 'SelectBoxExt';
var _pathShort = 'Extensions/' + _extension + '/';
var _pathLong = Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only&name=' + _pathShort;
var _webview = window.location.host === 'qlikview';
var _path = (_webview ? _pathShort : _pathLong);
var _LASTSTATUS = '';
var _LASTKEYVALUE = '';
//Variables defined in the extension settings
var _WEB_SERVICE_URL = '';
var _SQLTABLE = '';
var _CONNECTIONNAME = '';
var _AUDITTABLE = '';
var _CSS_FILE_NAME = '';
var _SELECTLABEL = '';
var _DROPDOWN_KEYVALUES = [{key:'',value:''},{key:'Reviewed',value:'R'}];
var _OSUSER = '';
var _APIKEY = '';
function UpdateableGraph_Init() {
    Qv.AddExtension(_extension,
        function () {
            var _this = this;

            $.support.cors = true;

            setProps();

            Qva.LoadCSS(Qva.Remote + (Qva.Remote.indexOf('?') >= 0 ? '&' : '?') + 'public=only' + '&name=' + "Extensions/" + _extension + "/" + _CSS_FILE_NAME);

            loadGrid();

            HideSelectBox();
            if(_this.Data.Rows.length == 1){
                displaySelectBox();
                getStatus();
            }

            function setProps(){
                _WEB_SERVICE_URL = _this.Layout.Text0.text;

                if(_WEB_SERVICE_URL.slice(-1) == "/" || _WEB_SERVICE_URL.slice(-1) == "\\"){
                	_WEB_SERVICE_URL = _WEB_SERVICE_URL.substr(0, _WEB_SERVICE_URL.length - 1);
                }

                _CONNECTIONNAME = _this.Layout.Text1.text;

                _SQLTABLE = _this.Layout.Text2.text;

                _AUDITTABLE = _this.Layout.Text3.text;

                _CSS_FILE_NAME = _this.Layout.Text4.text;

                var _DROPDOWN_CSV = _this.Layout.Text5.text;

                var dropdownarray = _DROPDOWN_CSV.split(",");
                
                if (dropdownarray.length > 0){
                	_DROPDOWN_KEYVALUES = [];
                	for(var i = 0; i < dropdownarray.length; i = i + 2){
                        if(i < dropdownarray.length -  1){
                    	   _DROPDOWN_KEYVALUES.push({key:dropdownarray[i],value:dropdownarray[i + 1]});
                        }
                	}
                }

                _SELECTLABEL = _this.Layout.Text6.text;

                _APIKEY	= _this.Layout.Text7.text;

                _OSUSER = _this.Layout.Text8.text;
                
            }

            function loadGrid(){

                var SelectBoxDiv = document.createElement("div");
                SelectBoxDiv.id = "SelectBox_" + GetSafeId();
                SelectBoxDiv.className = "containerDiv";
                _this.Element.appendChild(SelectBoxDiv);
            }

            function getSelectedStatus(){
                for(var i = 0; i < _this.Data.Rows[0].length;i++){
                    if(_this.Data.Rows[0][i].value == undefined){
                        return _this.Data.Rows[0][i].text;
                    }
                }
                return '';
            }

            function displaySelectBox(){
                //var selectedStatusValue = getSelectedStatus();
                var selectedIndex = 0;
            	if(_SELECTLABEL != ''){
            		var labelDiv = document.createElement("div");
            		labelDiv.className = "SelectionLabelDiv";
            		labelDiv.innerHTML = "<span>" + _SELECTLABEL + "</span>";
            		$('#SelectBox_' + GetSafeId()).append(labelDiv);
            	}
            	var SelectBoxDiv = document.createElement("div");
            	SelectBoxDiv.className = "select-style";

                // var statusSelect = document.createElement("div");

                var htmlStrings = '';
                for(var i = 0; i < _DROPDOWN_KEYVALUES.length;i++){
                    htmlStrings = htmlStrings + "<option value='" + _DROPDOWN_KEYVALUES[i].value + "'"

                    // if(selectedStatusValue == _DROPDOWN_KEYVALUES[i].value){
                    //     htmlStrings = htmlStrings + " selected "
                    // }
                    htmlStrings = htmlStrings +  ">" + _DROPDOWN_KEYVALUES[i].key + "</option>";
                }
                // statusSelect.innerHTML = "<select id='StatusSelect" + GetSafeId() + "'>" + htmlStrings + "</select>";
                SelectBoxDiv.innerHTML = "<select id='StatusSelect" + GetSafeId() + "' class='statusselectbox'>" + htmlStrings + "</select>";
                // SelectBoxDiv.appendChild(statusSelect);
                if(document.all && !document.addEventListener){
                    //this means it is running on IE8 or lower
                    var mainWidth = $("SelectBox_" + GetSafeId()).width();
                    var newWidth = mainWidth - 40;
                    SelectBoxDiv.style.width = newWidth + "px";
                }
                $('#SelectBox_' + GetSafeId()).append(SelectBoxDiv);
                if(document.all && !document.addEventListener){
                    //this means it is running on IE8 or lower
                    var mainWidth = $("#SelectBox_" + GetSafeId()).width();
                    var newWidth = mainWidth - 45;
                    SelectBoxDiv.style.width = newWidth + "px";
                }
                var imageDiv = document.createElement("div");
                imageDiv.className = "imageContainer";
                var ajaxDiv = document.createElement("div");
                ajaxDiv.id = "ajaxLoading" + GetSafeId();
                ajaxDiv.className = "ajaxDiv";
                ajaxDiv.style.backgroundImage="url('" + _pathLong + "ajax-loader.gif')";
                ajaxDiv.style.display = "none";
                var errorDiv = document.createElement("div");
                errorDiv.className = "ajaxDiv";
                errorDiv.id = "ajaxError" + GetSafeId();
                errorDiv.style.backgroundImage="url('" + _pathLong + "error.png')";
                errorDiv.style.display = "none";
                imageDiv.appendChild(ajaxDiv);
                imageDiv.appendChild(errorDiv);
                $('#SelectBox_' + GetSafeId()).append(imageDiv);
                addListeners();
            
			}
			
            function addListeners(){
            	var statusSelect = document.getElementById("StatusSelect" + GetSafeId());
            	statusSelect.setAttribute('KeyValue',_this.Data.Rows[0][0].text);
            	if(statusSelect.addEventListener){
                	statusSelect.addEventListener("change", changeStatus, false);
                }
                else{
                	statusSelect.attachEvent("onchange", changeStatus);
                }
            }

            function HideSelectBox(){
                $('#SelectBox_' + GetSafeId()).empty();
            }
            
            function getStatus(){
                disableSelectBox();
                if(_this.Data.Rows.length == 1){
                    if(_LASTKEYVALUE != _this.Data.Rows[0][0].text){
                        _LASTKEYVALUE = _this.Data.Rows[0][0].text;

                        var data = {'Table':_SQLTABLE,'OSUser':_OSUSER,'Id':_LASTKEYVALUE,'APIKey':_APIKEY,'ConnectionName':_CONNECTIONNAME};
                        showAjaxLoading();
                        $.ajax({
                            type: "GET",
                            url: _WEB_SERVICE_URL + '/Status/getstatus',
                            dataType: "json",
                            data: data,
                            success: function(data){
                                enableSelectBox();
                                hideImageDivs();
                                if(!data.Success){
                                    if(data.Error != undefined){
                                        showAjaxError(data.Error.ErrorCode + ":" + data.Error.Message);
                                    }
                                    else{
                                        showAjaxError('Failed to get current status');
                                    }
                                }
                                else{
                                    _LASTSTATUS = data.Status;
                                    setSelectValue(_LASTSTATUS);
                                    //SET STATUS
                                }
                            },
                            error: function (xhr, textStatus, thrownError) {
                                if(xhr.responseText.length < 200){
                                    showAjaxError(xhr.status + ': ' + xhr.responseText);
                                }
                                else{
                                    showAjaxError(xhr.status + ': Failed to retrieve status');
                                }
                                

                                enableSelectBox();
                            }
                        });
                    }
                    else{
                        //USE LAST STATUS TO SET STATUS
                        setSelectValue(_LASTSTATUS);
                        enableSelectBox();
                    }
                }
                
            }

            function changeStatus(){

                disableSelectBox();

            	var statusSelect = document.getElementById("StatusSelect" + GetSafeId());

                var selectValue = statusSelect.value;
                var GetMethod = '';
                var RowId = statusSelect.getAttribute('KeyValue');
                
                var data = {'Table':_SQLTABLE,'OSUser':_OSUSER,'TransactionTable':_AUDITTABLE,'Status':selectValue,'Id':RowId,'APIKey':_APIKEY,'ConnectionName':_CONNECTIONNAME};
                showAjaxLoading();
                $.ajax({
                    type: "POST",
                    url: _WEB_SERVICE_URL + '/status/UpdateStatus',
                    dataType: "json",
                    data: data,
                    success: function(data){
                        hideImageDivs();
                        if(!data.Success){
                        	if(data.Error != undefined){
                                showAjaxError(data.Error.ErrorCode + ":" + data.Error.Message);
                        	}
                            else{
                                showAjaxError('could not change status');
                            }
                        }
                        else{
                            _LASTSTATUS = selectValue;
                        }
                        enableSelectBox();
                    },
                    error: function (xhr, textStatus, thrownError) {
                        if(xhr.responseText.length < 200){
                            showAjaxError(xhr.status + ': ' + xhr.responseText);
                        }
                        else{
                            showAjaxError(xhr.status + ': Failed to register new status');
                        }
                        
                        enableSelectBox();
                    }
                });
            }

            function setSelectValue(val) {
                document.getElementById('StatusSelect' + GetSafeId()).value = val;
            }

            function enableSelectBox(){
                $('#SelectBox_' + GetSafeId() + ' .statusselectbox').each(function(element) {
                    $(this).removeAttr('disabled');
                });
            }

            function disableSelectBox(){
                $('#SelectBox_' + GetSafeId() + ' .statusselectbox').each(function(element) {
                    $(this).attr('disabled','true');
                });
            }

            function showAjaxLoading(){
                hideImageDivs();
                document.getElementById('ajaxLoading' + GetSafeId()).style.display = "inline-block";
            }

            function showAjaxError(title){
                hideImageDivs();
                ajaxErrorDiv = document.getElementById('ajaxError' + GetSafeId());
                ajaxErrorDiv.style.display = "inline-block";
                ajaxErrorDiv.title = title;
            }

            function hideImageDivs(){
                document.getElementById('ajaxLoading' + GetSafeId()).style.display = "none";
                document.getElementById('ajaxError' + GetSafeId()).style.display = "none";
            }
            function safeId(str) {
                return str.replace("\\", "_");
            }

            function GetSafeId() {
                return safeId(_this.Layout.ObjectId);
            }

        }, false);
}


UpdateableGraph_Init();

})(jQuery);