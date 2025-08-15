
A WeChat mini‑program for selling and delivering online course content.  It uses
CloudBase cloud functions and integrates with WeChat Pay to create and manage
course orders.

## Prerequisites

- [Node.js](https://nodejs.org/) 16+ and npm
- [WeChat Developer Tools](https://developers.weixin.qq.com/miniprogram/en/dev/devtools/download.html)
- A CloudBase environment and mini‑program AppID
- (Optional) WeChat Pay merchant account credentials for payment features

## Environment variables

Set the following variables in the cloud function environment:

| Name | Description |
| ---- | ----------- |
| `APPID` | Mini‑program AppID |
| `MCHID` | WeChat Pay merchant ID |
| `SERIAL_NO` | Merchant API certificate serial number |
| `MCH_PRIVATE_KEY` | Merchant private key; store with `\n` for newlines |
| `NOTIFY_URL` | HTTPS endpoint for payment notifications |
| `ADMIN_OPENIDS` | Comma‑separated OpenIDs allowed to manage data |
| `ALLOWED_IPS` | Comma‑separated IP addresses permitted to call admin functions |

## Installation

Install dependencies for each cloud function:

```bash
# from the repository root
for dir in cloudfunctions/*; do (cd "$dir" && npm install); done
```

## Deploying

### Mini-program

1. Open the project in WeChat Developer Tools (select `project.config.json`).
2. Choose the target CloudBase environment.
3. Click **Compile** to preview or **Upload** to deploy.

### Cloud functions

1. After installing dependencies, open the `cloudfunctions` folder in the
   Developer Tools.
2. Right‑click each function (e.g. `createOrder`, `listCourses`) and choose
   **Upload and Deploy**.

## Seeding demo data

Deploy the `seedData` function and then execute:

```javascript
wx.cloud.callFunction({ name: 'seedData' });
```

This inserts example courses and lessons.  Invocation is restricted by
`ADMIN_OPENIDS` and `ALLOWED_IPS`.

## Common workflows

- **Install dependencies** – run the shell loop shown above.
- **Seed the database** – call `seedData` from the Developer Tools console.
- **Add a course** – `wx.cloud.callFunction({ name: 'addCourse', data: { title, brief, price } })`.
- **Mark an order paid** – `wx.cloud.callFunction({ name: 'markOrderPaid', data: { outTradeNo } })`.

## License

MIT