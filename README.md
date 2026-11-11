# Lunex Website

Marketing website for **Lunex**, a Malaysian multi-cloud reseller for AWS, Google Cloud,
Alibaba Cloud, Tencent Cloud, Huawei Cloud and BytePlus.

Plain HTML, CSS and JavaScript: no build step and no dependencies.

## Pages

| File | Page |
|---|---|
| `index.html` | Home |
| `services.html` | Services, cloud matchmaker, cloud partners, FAQ |
| `about.html` | About Us |
| `contact.html` | Contact Us (form is front-end only for now) |

## Run locally

Open `index.html` in a browser, or in a terminal:

```powershell
start index.html
```

## Structure

```
css/style.css           shared styles
js/main.js              shared scripts (animations, matchmaker, form, etc.)
assets/img/             Lunex logo and icons
assets/img/clouds/      cloud partner logos
```

## To do before launch

- Replace the `**` placeholders (email, phone/WhatsApp, address, business hours).
- Replace the cloud logos with official files from each partner portal.
- Connect the contact form to a form service (for example Formspree) if it should send emails.
