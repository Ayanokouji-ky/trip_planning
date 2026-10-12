*******AI 调用模块******
1.API KEY：ark-cad8d48c-f35b-4dd9-82df-35cc174af75d-55b4c

curl --location 'https://ark.cn-beijing.volces.com/api/v3/responses' \
--header "Authorization: Bearer $ARK_API_KEY" \
--header 'Content-Type: application/json' \
--data '{
    "model": "deepseek-v4-1-flash-260910",
    "stream": true,
    "tools": [
        {
            "type": "web_search",
            "max_keyword": 3
        }
    ],
    "input": [
        {
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "今天有什么热点新闻"
                }
            ]
        }
    ]
}'
********AI 调用模块结束*****

********地图API 调用模块*******
百度地图AK：SQWFoL8hiHpxV6ULOWTAmB7P9qJ5vfpL
********地图API 调用结束*******

### git 私人令牌
ee6dbd56ec5e690b28eca5502a6c599a

### gti 仓库地址
https://gitee.com/Ayanokouji/trip_planning.git