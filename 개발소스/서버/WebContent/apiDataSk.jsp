<%@ page contentType="text/xml; charset=UTF-8" language="java" import="java.net.*" import="java.io.*" import="java.util.*" import="net.sf.json.JSON" import="net.sf.json.xml.XMLSerializer"%><%!    public String postRequest(String targetURL) {	    URL url;	    HttpURLConnection connection = null;	    try {	        // Create connection	        System.out.println("targetURL==>"+targetURL);	        url = new URL(targetURL);	        connection = (HttpURLConnection) url.openConnection();	        connection.setRequestProperty("Referer", "http://myapi.paas.codekorea.kr/");	        connection.setRequestMethod("GET");		        connection.setUseCaches(false);	        connection.setDoInput(true);	        connection.setDoOutput(false);		        // Get Response	        InputStream is = connection.getInputStream();	        BufferedReader rd = new BufferedReader(new InputStreamReader(is, "UTF-8"));	        String line;	        StringBuffer response = new StringBuffer();	        while ((line = rd.readLine()) != null) {	            response.append(line);	        }	        rd.close();	        return response.toString();		    } catch (Exception e) {		        e.printStackTrace();	        return null;		    } finally {		        if (connection != null) {	            connection.disconnect();	        }	    }	}%><%    //파라미터 취득    Map<String, String[]> paramMap = request.getParameterMap();    System.out.println("req =>"+paramMap);    Iterator it = paramMap.keySet().iterator();    String key = null;    String[] value = null;    String paramStr = "";    while(it.hasNext())    {        key = it.next().toString();        value = paramMap.get(key);        if(value.length>0         	&& !"callback".equals(key) && !"_".equals(key) && !"callApi".equals(key) )        {            System.out.println(key + " : " + value[0] );            paramStr += URLEncoder.encode(key,"UTF-8")+"="+URLEncoder.encode(value[0],"UTF-8")+"&";        }    }    System.out.println("paramStr : " + paramStr );        //API call하여 데이터 취득    String callUrl = "";    String appKey = "{SK플래닛 서비스 키}";    if ("sk01".equals(paramMap.get("callApi")[0] )){    	callUrl = "http://apis.skplanetx.com/weather/current/minutely?appKey="+appKey+"&";    }else if ("sk01-1".equals(paramMap.get("callApi")[0] )){        callUrl = "http://apis.skplanetx.com/weather/summary?appKey="+appKey+"&";    }else if ("sk02".equals(paramMap.get("callApi")[0] )){        callUrl = "http://apis.skplanetx.com/hoppin/charts/movie?appKey="+appKey+"&";    }else if ("sk03".equals(paramMap.get("callApi")[0] )){        callUrl = "http://apis.skplanetx.com/melon/charts/todaytopsongs?appKey="+appKey+"&";    }        String json = postRequest(callUrl+paramStr);        //json데이터로 보냄        System.out.println("result==>"+ json);    request.setAttribute("sw", json);%><%-- ajax 에서 넘겨준 callback 함수 파라메터 가져오기 --%>${param.callback}(${sw});