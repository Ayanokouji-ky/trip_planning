FROM nginx:1.27-alpine

ENV TZ=Asia/Shanghai

# SPA 静态资源
COPY dist/ /usr/share/nginx/html/
# Nginx 配置（含 /api 反代与前端路由回退）
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
