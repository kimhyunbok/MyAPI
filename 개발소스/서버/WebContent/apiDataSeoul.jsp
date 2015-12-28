<%@ page contentType="text/xml; charset=UTF-8" language="java" import="java.net.*" import="java.io.*" import="java.util.*" import="net.sf.json.*"
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
            connection.setRequestProperty("Referer", "http://myapi.paas.codekorea.kr/");
            connection.setRequestMethod("GET");
    
            connection.setUseCaches(false);
            connection.setDoInput(true);
            connection.setDoOutput(false);
    
            // Get Response
            InputStream is = connection.getInputStream();
            BufferedReader rd = new BufferedReader(new InputStreamReader(is, "UTF-8"));
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
    String paramStr = request.getParameter("paramStr");
    String serviceName = request.getParameter("serviceName");
    System.out.println("paramStr : " + paramStr );
    String serviceKey = "{서울시 열린데이터 광장 서비스 키}";
    //API call하여 데이터 취득
    String callUrl = "http://openapi.seoul.go.kr:8088/"+serviceKey+"/json/";
    
    String json = postRequest(callUrl+paramStr);
    
    //json 안에 검색어에 해당되는 것들만 추출
    Map<String, String[]> paramMap = request.getParameterMap();
    System.out.println("req =>"+paramMap);
    Iterator it = paramMap.keySet().iterator();
    String key = null;
    String[] value = null;
    boolean searchFlag = false;
    while(it.hasNext())
    {
        key = it.next().toString();
        value = paramMap.get(key);
        if(value.length>0 
            && !"callback".equals(key) && !"_".equals(key)
            && !"paramStr".equals(key) && !"serviceName".equals(key) )
        {
            searchFlag = true;
            break;
        }
    }
    
    if (searchFlag){
    	JSONArray jsonArray = null;
	    JSONArray resArray = new JSONArray();
	    JSONObject jsonObj = null;
	    JSONObject resObj = null;
	    Iterator iter = null;
	    boolean boolRes = false;
	    //System.out.println("json==>"+json);
	    
	    resObj = JSONObject.fromObject(json);
	    jsonArray = (JSONArray)((JSONObject)resObj.get(serviceName)).get("row");
	    
        //System.out.println("jsonArray==>"+jsonArray);
        for(int i=0; i<jsonArray.size(); i++){
            jsonObj = (JSONObject) jsonArray.get(i);
            iter = paramMap.keySet().iterator();
            boolRes = false;
            while(iter.hasNext()){
                key = (String) iter.next();
                if (!"callback".equals(key) && !"_".equals(key)
                		&& !"paramStr".equals(key) && !"serviceName".equals(key)){
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
        
        ((JSONObject)resObj.get(serviceName)).put("row", resArray);
        json = resObj.toString();
    }
    
    /*System.out.println("result==>"+
            json
            );*/
    
    //json데이터로 보냄
    request.setAttribute("sw", json);
%>
<%-- ajax 에서 넘겨준 callback 함수 파라메터 가져오기 --%>
${param.callback}(${sw});
