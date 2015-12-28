/*
 * common.js
 * 
 * Copyright (c) 2015 poppppp
 * Context - http://www.poppppp.com
 * 
 * Dual licensed under the MIT and GPL licenses.
 *
 */
	var webdb = {};
	
	webdb.db = null;

	webdb.open = function() {
	  var dbSize = 5 * 1024 * 1024; // 5MB
	  webdb.db = window.openDatabase("MyApiDB", "1.0", "MyApi 데이터베이스", dbSize);
	  
	};
	
	webdb.onError = function(tx, e) {
	  alert("DB error: " + e.message);
	};
	
	webdb.createTable = function() {
	  webdb.db.transaction(function(tx) {
	    /*tx.executeSql("DROP TABLE " +
	                  "SEARCH_HIST", []
	                  ,null,webdb.onError);*/
	    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
	                  "SEARCH_HIST(CALL_API, IDX INTEGER, SEQ INTEGER, ID, DATA TEXT, TEXT_DATA TEXT, CREATE_DT DATETIME)", []
	                  ,null,webdb.onError);
	    tx.executeSql("CREATE INDEX IF NOT EXISTS SEARCH_HIST_IDX ON SEARCH_HIST (CALL_API, IDX, SEQ)", []
	                  ,null,webdb.onError);
	  });
	};
	
	webdb.createAppConfigTable = function() {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("CREATE TABLE IF NOT EXISTS " +
	                  "APP_CONFIG(CONFIG_KEY PRIMARY KEY, CONFIG_DATA TEXT)", []
	                  ,null,webdb.onError);
	  });
	};
	
	webdb.insertAppConfigData = function(key, data) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("DELETE FROM APP_CONFIG "
    	             +"where CONFIG_KEY = ? "
    	              ,[key]
    	              ,null,webdb.onError);
    	              
    	tx.executeSql("INSERT INTO APP_CONFIG (CONFIG_KEY, CONFIG_DATA) "
    	             +"values (?, ?) "
    	              ,[key, data]
    	              ,null,webdb.onError);
	  });
	};
	
	webdb.selectAppConfigData = function(key) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("select * "
	                 +"  from APP_CONFIG "
	                 +" WHERE CONFIG_KEY = ? "
	                  ,[key]
	                  ,fnGetAppConfigData
	                  ,webdb.onError);
	  });
	};
	
	webdb.deleteAppConfigAll = function() {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("DELETE FROM SEARCH_HIST " +
	                  "", []
	                  ,null,webdb.onError);
		tx.executeSql("DELETE FROM APP_CONFIG " +
	                  "", []
	                  ,null,webdb.onError);
	  });
	};
	
	webdb.insertNextData = function(dataObj) {
	  if (window.openDatabase) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("select IFNULL(MAX(IDX),0)+1 AS idx "
	                 +"  from SEARCH_HIST "
	                 +" WHERE CALL_API = ? "
	                  ,[dataObj.call_api]
	                  ,function (tx, rs) {
	                      if (rs.rows.item(0).idx > 10){
	                          webdb.rollingData(dataObj);
	                      }else{
                              webdb.insertData(rs.rows.item(0).idx, dataObj);
                          }
                      }
	                  ,webdb.onError);
	  });
	  }
	};
	
	webdb.rollingData = function(dataObj) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("DELETE FROM SEARCH_HIST "
    	             +"where CALL_API = ? and idx = 1 "
    	              ,[dataObj.call_api]
    	              ,null,webdb.onError);
    	              
    	tx.executeSql("UPDATE SEARCH_HIST "
    	             +"   set idx = idx - 1 "
    	             +" where CALL_API = ? "
    	              ,[dataObj.call_api]
    	              ,null,webdb.onError);
	    
	    for (var i=0; i < dataObj.data.length; i++) {
    	    tx.executeSql("INSERT INTO SEARCH_HIST (CALL_API, IDX, SEQ, ID, DATA, TEXT_DATA, CREATE_DT) "
    	                 +"values (?, 10, ?, ?, ?, ?, '"+(new Date())+"') "
    	                  ,dataObj.data[i]
    	                  ,null,webdb.onError);
	    }
	  });
	};
	
	webdb.insertData = function(gIdx, dataObj) {
	  webdb.db.transaction(function(tx) {
	    for (var i=0; i < dataObj.data.length; i++) {
    	    tx.executeSql("INSERT INTO SEARCH_HIST (CALL_API, IDX, SEQ, ID, DATA, TEXT_DATA, CREATE_DT) "
    	                 +"values (?, "+gIdx+", ?, ?, ?, ?, '"+(new Date())+"') "
    	                  , dataObj.data[i]
    	                  ,null,webdb.onError);
	    }
	  });
	};
	
	webdb.deleteSearchHistAll = function() {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("DELETE FROM SEARCH_HIST " +
	                  "", []
	                  ,null,webdb.onError);
	  });
	};
	
	
	webdb.selectHistoryData = function(callApi) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql(
	                  "select ID, DATA, TEXT_DATA from ( "
	                 +"select IDX, GROUP_CONCAT(ID,'|') ID, GROUP_CONCAT(DATA,'|') DATA, GROUP_CONCAT(TEXT_DATA,'|') TEXT_DATA "
	                 +"  from SEARCH_HIST "
	                 +" WHERE CALL_API = ? "
	                 +" GROUP BY IDX "
	                 +" ) GROUP BY ID, DATA, TEXT_DATA "
	                 +" ORDER BY MAX(IDX) DESC "
	                  ,[callApi]
	                  ,function (tx, rs) {
	                          $("#histListGroup a").remove();
	                          var functionName = "fnGetHistory";
	                          if (callApi=="seoul03"){
	                            functionName = "fnGetHistorySeoul03";
	                          }
	                          
    	                      for (var i=0; i < rs.rows.length; i++) {
    	                        
    	                        $("#histListGroup").append(
    	                        '<a href="#none" onclick="'+functionName+'(this);" class="list-group-item" data-id="'+rs.rows.item(i).ID+'" data-data="'+rs.rows.item(i).DATA+'" >'+rs.rows.item(i).TEXT_DATA+'</a>'
    	                        );
    	                      }
    	                      
							  $("#histListGroup").append(
    	                        '<a href="#none" onclick="$(document.body).hideLoading({indicatorID:\'historyList\', removeObj:\'N\'});" class="list-group-item" style="background-color:#337ab7;color:#fff;text-align:center;" >취소</a>'
    	                      );
							  
    	                      $(document.body).showLoading({divId:'historyList', removeObj:"N"});
    	                      if (rs.rows.length == 0){
    	                        $(document.body).hideLoading({indicatorID:"historyList", removeObj:"N"});
    	                      }
                            }
	                  ,webdb.onError);
	  });
	};
	
	var fnGetHistory = function (obj){
	    var dataId = $(obj).attr("data-id");
	    var dataData = $(obj).attr("data-data");
	    
	    arrDataId = dataId.split("|");
	    arrDataData = dataData.split("|",arrDataId.length);
	    for (var i=0; i < arrDataId.length; i++) {
          $("#"+arrDataId[i]).val(arrDataData[i]);
        }
	    
	    $(document.body).hideLoading({indicatorID:"historyList", removeObj:"N"});
	}
	
	webdb.selectRecentData = function(callApi) {
	  webdb.db.transaction(function(tx) {
	    tx.executeSql("select ID, DATA "
	                 +"  from SEARCH_HIST "
	                 +" WHERE CALL_API = ? "
	                 +"   AND IDX = (select max(IDX) from SEARCH_HIST where CALL_API = ? ) "
	                  ,[callApi, callApi]
	                  ,function (tx, rs) {
	                      for (var i=0; i < rs.rows.length; i++) {
	                        $("#"+rs.rows.item(i).ID).val(rs.rows.item(i).DATA);
	                      }
                      }
	                  ,webdb.onError);
	  });
	};
	
	var fnHistory = function(){
	    
	    if (window.openDatabase) {
	        webdb.selectHistoryData(callApi);
	    }
	    
	}
	
    
	$(function(){
	
      $("#includedContent").load("../include/header.html");
      
      if (!window.openDatabase) {
      	  return;
	  }else {
	      webdb.open();
	      //최근 검색어를 default
	      if (callApi!="main" && callApi!="seoul03" && callApi!="data01"){
	          webdb.createTable();
	          webdb.selectRecentData(callApi);
	      }
	      
	      /*var dataObj = new Object();
	      dataObj.call_api = "data01";
	      dataObj.data = new Array();
	      var arrTemp = [dataObj.call_api, 1, "p1", "테트리스..."];
	      
	      dataObj.data.push(arrTemp);
	      
	      arrTemp = [dataObj.call_api, 2, "p2", "애니팡..."];
	      dataObj.data.push(arrTemp);
	      
	      webdb.insertNextData(dataObj);
	      */
	      
	      //webdb.insertData();
	      //webdb.deleteAll();
	  }
	  
      
    });
	
	$(document).ready(function(){
		$("#back-top").hide();

	    $(window).scroll(function () {
			if ($(this).scrollTop() > 100) {
				$('#back-top').fadeIn();
			} else {
				$('#back-top').fadeOut();
			}
		});

		// scroll body to 0px on click
		$('#back-top a').click(function () {
			$('body,html').animate({
				scrollTop: 0
			}, 500);
			return false;
		});
		
		$('input').addClass("ui-widget ui-widget-content ui-corner-all");
		
	});
	
	var fnLocationError = function(err){
	    msg = "";
	    switch(err.code) {
            case err.PERMISSION_DENIED:
                msg="사용자가 위치 기능 사용을 거부했습니다."
                break;
            case err.POSITION_UNAVAILABLE:
                msg="위치를 구할 수 없습니다."
                break;
            case err.TIMEOUT:
                msg="시간을 초과했습니다."
                break;
            case err.UNKNOWN_ERROR:
                msg="기타 에러"
                break;
        }
        $(document.body).hideLoading();
        //alert (msg);
        navigator.notification.alert(msg,null,alertTitle);
        
	};
	
	var fnHelp = function(){
		navigator.notification.alert (eval(callApi),null,helpTitle);
		//alert (eval(callApi));
	};
    
    //var apiUrl = "http://192.168.0.139:8080";
    var apiUrl = "http://panalu.ipdisk.co.kr:8080";
	//var apiUrl = "http://myapi.paas.codekorea.kr";
	//var apiUrl = "http://myapi.52.21.208.217.xip.io";
	
    
    var dataUrl = apiUrl + "/apiData.jsp";
    var dataJsonUrl = apiUrl + "/apiData2.jsp";
    var dataDaumUrl = apiUrl + "/apiDataDaum.jsp";
    var dataSeoulUrl = apiUrl + "/apiDataSeoul.jsp";
	var dataSkUrl = apiUrl + "/apiDataSk.jsp";
    
    
    var alertTitle = "알림";
	var endTitle = "종료";
	var helpTitle = "도움말";
    var alertNoData = "해당 데이터가 없습니다.";
    var alertNetwork = "network가 불안정합니다.잠시후 다시 사용하십시오!";
	var clearDataSuccess = "초기화가 완료되었습니다.";
	var saveDataSuccess = "저장되었습니다.";
	var deleteDataSuccess = "삭제되었습니다.";
    
    var favoriteTitle = "즐겨찾기";
    var confirmFavorite = "즐겨찾기에 등록하시겠습니까?";
	var deleteFavorite = "즐겨찾기에서 삭제하시겠습니까?";
	var existFavorite = "즐겨찾기에 이미 등록되어 있습니다.";
    var confirmYN = ["예","아니오"];
    
	var main = "Main/즐겨찾기\n1. Main화면에서 API아이콘을 길게 누르면 즐겨찾기에 등록할 수 있습니다.\n2. 즐겨찾기화면에서 API아이콘을 길게 누르면 즐겨찾기에서 삭제할 수 있습니다.";
	var data01 = "새로 바뀐 우편번호를 검색합니다.\n1.지도에서 검색 : 지도에서 건물을 선택하여 도로명주소를 얻어 우편번호를 검색합니다.";
	var data02 = "장소와 키워드로 공연전시 정보를 검색합니다.";
	var data03 = "병원/의원 정보를 검색합니다.\n원하는 지역선택도 가능하며, 진료요일로 검색하여 휴일에 운영하는 병/의원을 검색할 수 있습니다.";
	var data04 = "약국 정보를 검색합니다.\n원하는 지역선택도 가능하며, 진료요일로 검색하여 휴일에 운영하는 약국을 검색할 수 있습니다.";
	var data05 = "차별화된 서비스와 저렴한 가격으로 물가안정에 기여하는 착한가격업소를 검색합니다."
	var data06 = "전국 대학별 입학금, 등록금(수업료+기성회비)에 대한 정보를 확인할 수 있습니다.";
	var data07 = "소상공인의 창업 및 입지선정 지원을 위한 유동인구 통계를 분석합니다.\n※데이터량이 많아 조회에 30초 정도의 시간이 걸립니다.";
	var data08 = "전국동물병원 정보를 제공합니다.";
	var data09 = "전국 공중화장실 정보를 제공합니다.";
	var seoul01 = "서울시 대중교통 통합분실물센터에서 제공하는 분실물 찾기 서비스입니다.\n버스, 지하철, 택시에서 분실한 물품을 실시간으로 검색할 수 있습니다.";
	var seoul02 = "교통카드(선후불교통카드 및 1회용 교통카드)를 이용한 지하철역별(서울메트로, 도시철도공사, 한국철도공사, 공항철도, 9호선) 승하차인원 통계를 조회합니다.\n※사용월 칸에 분석할 년월을 붙여서 입력합니다.(예 : 201509)";
	var seoul03 = "지하철역별 열차 도착 정보를 검색합니다.\n※역별 지하철 시각표를 기준으로 제공하는 정보이며 실제 도착시간과 다를 수 있습니다.";
	var seoul04 = "서울시설공단에서 운영하는 공영주차장 중 자동화주차장의 주차가능댓수를 서비스 합니다.\n데이터는 10분주기로 반영됩니다.";
	var seoul05 = "서울시설공단에서 운영하는 공영주차장의 인터넷 정기권 판매현황 정보입니다.\n※공영주차장 정기권 판매는 매달 18일 부터 판매가 시작되므로 18일까지 전월데이터가 출력됩니다.";
	var seoul06 = "서울시의 가격이 저렴하고 서비스가 좋은 가격안정모범업소(착한가게) 정보를 제공합니다.";
	var seoul07 = "서울시 자치구별 대기환경정보를 제공합니다.\n매시간 갱신되는 정보로서, 25개 자치구 전체 또는 원하는 자치구만의 대기환경정보를 볼 수 있습니다.\n제공되는 데이터는 통합대기환경 지수와 등급, 지수결정 물질 및 미세먼지(PM-10), 오존, 이산화질소, 일산화탄소, 아황산가스 측정값입니다.";
	var map01 = "위치정보를 다음지도를 통해 제공합니다.";
	var map02 = "내 위치주변의 여러시설들을 카테고리별로 검색합니다.";
	var map03 = "지도에서 도로명주소를 검색합니다.\n검색어에 건물/회사명을 입력하여 검색한 후 건물을 클릭하면 도로명 키워드가 반영됩니다.\n확인을 클릭하여 우편번호 검색으로 이동합니다.";
	
	var daum01 = "소문난 맛집을 검색합니다.\n내위치입력을 클릭하면 내위치의 지역이 자동입력되어 검색이 가능합니다.";
	var daum02 = "맛있게 먹을 수 있는 레시피를 검색합니다.\n냉장고 안에 남아 있는 재료들을 입력해 보세요.\n음식재료들을 스페이스를 구분하여 입력하면 해당 재료로 요리할 수 있는 정보들이 제공됩니다.(예 : 김치 계란 콩나물)";
	var daum03 = "상품의 최저가 정보를 검색합니다.\n마트에서 세일하는 상품이 정말 싼 것인지 의문이 많이 드셨죠?\n제품이나 상품명을 정확히 입력하면 인터넷 최저가 정보를 검색할 수 있습니다.";
	var daum04 = "여행지의 가볼만한 곳들을 소개합니다.\n지역을 입력하거나 내위치를 입력하여 여행지를 검색/방문하고 소중한 기억을 간직하세요.";
	
	var sk01 = "내 현재위치의 기상청 데이터를 SK플래닛을 통해 제공합니다.";
	var sk02 = "hoppin에서 제공하는 영화순위 top10을 제공합니다.";
	var sk03 = "멜론에서 제공하는 실시간순위 top100을 제공합니다.";
	
	var compass = "스마트폰의 compass기능을 활용하여 나침반을 활용합니다.";
	
