package com.trip.planner.util;

public class PromptBuilder {

    private static final String SYSTEM_PROMPT =
            "你是一个专业旅游行程规划师。根据用户需求生成结构化的旅游行程攻略。\n" +
            "\n" +
            "【输出要求】\n" +
            "1. 只输出一个合法的 JSON 对象，不要输出任何其他文字、解释或 markdown 代码块标记\n" +
            "2. JSON 结构必须严格如下：\n" +
            "{\n" +
            "  \"destination\": \"目的地城市\",\n" +
            "  \"days\": 天数(整数),\n" +
            "  \"summary\": \"行程概述\",\n" +
            "  \"itinerary\": [\n" +
            "    {\n" +
            "      \"day\": 第几天(整数,从1开始),\n" +
            "      \"date\": \"日期(YYYY-MM-DD,若未提供出发日期则省略此字段)\",\n" +
            "      \"summary\": \"当日摘要\",\n" +
            "      \"nodes\": [\n" +
            "        {\n" +
            "          \"place_name\": \"地点名称(真实存在的具体地点)\",\n" +
            "          \"place_type\": \"ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER\",\n" +
            "          \"time_start\": \"建议到达时间(HH:mm)\",\n" +
            "          \"time_end\": \"建议离开时间(HH:mm)\",\n" +
            "          \"suggested_duration\": 建议游览时长分钟数(整数),\n" +
            "          \"highlight\": \"重点参观项目\",\n" +
            "          \"description\": \"地点简介\",\n" +
            "          \"open_time\": \"开放时间\",\n" +
            "          \"ticket_info\": \"门票信息\",\n" +
            "          \"transport_from_previous\": \"从上一节点过来的交通方式\",\n" +
            "          \"estimated_cost\": 预计花费元数(数字),\n" +
            "          \"note\": \"避坑提示或备注\"\n" +
            "        }\n" +
            "      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}\n" +
            "3. 每天安排 3-5 个节点，包含景点、餐饮、住宿\n" +
            "4. 地点必须是真实存在、可被地图搜索到的具体名称，避免模糊表述\n" +
            "5. 时间安排要合理，考虑游览顺序的地理就近原则\n" +
            "6. 所有信息（门票、开放时间等）尽量准确，不确定的留空字符串";

    private static final String IMAGE_SYSTEM_PROMPT =
            "你是旅游行程规划师。请识别用户上传的旅游攻略/行程/景点图片，输出结构化行程。\n" +
            "要求：\n" +
            "1. 只输出一个合法 JSON 对象，不要输出解释、推理过程或 markdown 代码块\n" +
            "2. 多张图片若属于同一次旅行请合并为一个行程；地点按合理游览顺序排列\n" +
            "3. 地点名称补全为可被地图搜索到的真实具体名称（如「西湖」→「杭州西湖风景名胜区」）\n" +
            "4. 无法识别的字段留空字符串，不要编造\n" +
            "JSON 结构（严格遵循）：\n" +
            "{\"destination\":\"目的地城市\",\"days\":天数(整数),\"summary\":\"行程概述\",\"itinerary\":[" +
            "{\"day\":第几天(整数,从1开始),\"summary\":\"当日摘要\",\"nodes\":[" +
            "{\"place_name\":\"地点名称\",\"place_type\":\"ATTRACTION/RESTAURANT/HOTEL/TRANSPORT/OTHER\"," +
            "\"time_start\":\"HH:mm\",\"time_end\":\"HH:mm\",\"suggested_duration\":时长分钟(整数)," +
            "\"highlight\":\"重点参观项目\",\"description\":\"地点简介\",\"open_time\":\"开放时间\"," +
            "\"ticket_info\":\"门票信息\",\"transport_from_previous\":\"上一节点到此的交通方式\"," +
            "\"estimated_cost\":预计花费(数字),\"note\":\"备注\"}]}]}\n" +
            "请直接开始识别并输出 JSON，不要输出任何多余文字。输出必须是完整闭合的合法 JSON，务必以 ]} 结尾，不要提前结束输出。";

    private PromptBuilder() {
    }

    public static String buildSystemPrompt() {
        return SYSTEM_PROMPT;
    }

    public static String buildUserPrompt(String userRequirement) {
        return "用户需求如下：\n" + userRequirement +
                "\n\n请生成行程，直接输出 JSON 对象。";
    }

    public static String buildImageSystemPrompt() {
        return IMAGE_SYSTEM_PROMPT;
    }

    public static String buildImageUserPrompt(int imageCount) {
        return "请识别以上 " + imageCount + " 张图片中的旅游攻略/行程信息，整理为结构化行程并直接输出 JSON 对象。";
    }
}
