<%@ page contentType="text/xml; charset=UTF-8" language="java" import="java.net.*" import="java.io.*" import="java.util.*" import="org.json.simple.*"
%>
<%!
    public String postRequest(String targetURL) {
        URL url;
        HttpURLConnection connection = null;
        try {
            // Create connection
            System.out.println("targetURL==>"+targetURL);
            url = new URL(targetURL);
            connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
    
            connection.setUseCaches(false);
            connection.setDoInput(true);
            connection.setDoOutput(false);
    
            // Get Response
            InputStream is = connection.getInputStream();
            BufferedReader rd = new BufferedReader(new InputStreamReader(is, "EUC-KR"));
            String line;
            StringBuffer response = new StringBuffer();
            while ((line = rd.readLine()) != null) {
                response.append(line);
            }
            rd.close();
            return response.toString();
    
        } catch (Exception e) {
    
            e.printStackTrace();
            return null;
    
        } finally {
    
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
%>
<%
    //파라미터 취득
    Map<String, String[]> paramMap = request.getParameterMap();
    System.out.println("req =>"+paramMap);
    Iterator it = paramMap.keySet().iterator();
    String key = null;
    String[] value = null;
    String paramStr = "";
    while(it.hasNext())
    {
        key = it.next().toString();
        value = paramMap.get(key);
        if(value.length>0 
            && !"callback".equals(key) && !"_".equals(key) && !"callApi".equals(key) )
        {
            System.out.println(key + " : " + value[0] );
            paramStr += URLEncoder.encode(key,"UTF-8")+"="+URLEncoder.encode(value[0],"UTF-8")+"&";
        }
    }
    System.out.println("paramStr : " + paramStr );
    
    //API call하여 데이터 취득
    String callUrl = "";
    String serviceKey = "{공공데이터 포털 서비스 키}";
    if ("data05".equals(paramMap.get("callApi")[0] )){
        callUrl = "http://api.data.go.kr/openapi/da35a71f-3a48-46f5-8f02-e476e26ba9ce?serviceKey="+serviceKey+"&s_page=1&s_list=100000&type=json&";
    }else if ("data06".equals(paramMap.get("callApi")[0] )){
        callUrl = "http://api.data.go.kr/openapi/1bb9333f-3078-442e-bbf3-ecb9396532b5?serviceKey="+serviceKey+"&s_page=1&s_list=1000&type=json&";
    }else if ("data07".equals(paramMap.get("callApi")[0] )){
        callUrl = "http://api.data.go.kr/openapi/110b7274-94bf-4335-8123-ad3ab25a0dee?serviceKey="+serviceKey+"&s_page=1&s_list=1000000&type=json&";
    }else if ("data08".equals(paramMap.get("callApi")[0] )){
        callUrl = "http://api.data.go.kr/openapi/2a10bf31-d326-4023-a8c9-ed3e52869723?serviceKey="+serviceKey+"&s_page=1&s_list=1000000&type=json&";
    }else if ("data09".equals(paramMap.get("callApi")[0] )){
        callUrl = "http://api.data.go.kr/openapi/7484f908-a50e-4717-861e-bdc5f95d5aec?serviceKey="+serviceKey+"&s_page=1&s_list=1000000&type=json&";
    }
    
    //json데이터로 보냄
    String json = postRequest(callUrl);
    
    //json 안에 검색어에 해당되는 것들만 추출
    
    JSONArray jsonArray = null;
    JSONArray resArray = new JSONArray();
    JSONObject jsonObj = null;
    Iterator iter = null;
    boolean boolRes = false;
    if (!"".equals(paramStr)){
	    jsonArray = (JSONArray)JSONValue.parse(json);
	    for(int i=0; i<jsonArray.size(); i++){
	        jsonObj = (JSONObject) jsonArray.get(i);
	        iter = paramMap.keySet().iterator();
	        boolRes = false;
	        while(iter.hasNext()){
	            key = (String) iter.next();
	            if (!"callback".equals(key) && !"_".equals(key) && !"callApi".equals(key)){
	            	/*System.out.println("result==>"+
			            jsonObj.get(key).toString()+"="+paramMap.get(key)[0].toString()
			            );*/
	            	if (jsonObj.get(key) != null
	            		&& jsonObj.get(key).toString().indexOf(paramMap.get(key)[0].toString()) > -1 ){
	            	    boolRes = true;
	            	}else{
	            		boolRes = false;
	            		break;
	            	}
	            }
	        }
	        
	        if (boolRes){
	        	resArray.add(jsonObj);
	        }
	        
	    }
	    json = resArray.toJSONString();
    }
    System.out.println("result==>"+
            json
            );
    
    request.setAttribute("sw", json);
%>
<%-- ajax 에서 넘겨준 callback 함수 파라메터 가져오기 --%>
${param.callback}(${sw});
