# Void Weaver

Космический 2D-рогалик-шутер: сектора, боссы, модули, скины и ежедневный забег.
Играется в браузере (ПК и телефон) и в портативной Windows-сборке.

![Void Weaver](https://hano-games.netlify.app/img/cover-vw-wide.jpg)

## Что внутри

- кампания с боссами и Boss Rush;
- карта секторов: элитные и аномальные узлы;
- модули, скины и комбо-билды;
- graze-механика и ранги за забег;
- ежедневный забег;
- сохранение забега, пауза, настройки;
- русский и английский языки.

## Управление

| Ввод | Действие |
|---|---|
| WASD / стрелки | движение |
| Мышь | прицел |
| ЛКМ | огонь |
| Space / Shift | рывок |
| P / Esc | пауза |
| L | язык RU/EN |

На телефоне управление появляется автоматически: два стика и кнопки способностей.

## Структура

```
main.js          — Electron-обёртка для Windows
preload.js       — мост настроек
index.html       — веб-сборка игры (та же, что в браузере)
web/index.html   — копия веб-сборки для публикации
build/icon.ico   — иконка Windows
package.json     — зависимости и сборка portable exe
```

## Запуск из исходников

```bash
npm install
npm start
```

## Сборка Windows

```bash
npm install
npm run dist
```

Готовый файл появится в `dist/` (portable, x64).

## Скачать

- itch.io: https://hanosoulls.itch.io/void-weaver (браузер и Windows)
- Windows: раздел **Releases** этого репозитория;
- браузер: https://hano-games.netlify.app/games/void-weaver/

## Автор

Hano Games — https://hano-games.netlify.app

Исходный код игры распространяется как есть, без гарантий. Все права на игру и материалы принадлежат автору.
