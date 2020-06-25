Утилита для создания спрайтшитов для использования в pixi.js
===
Принцип такой - в папку input кладем картинки, на выходе, в папке output получаем результат.\
К примеру тебе для очередных гребаных слотов нужны анимированные символы, задники, еще какая-нибудь херня. Создаем папку output, в ней создаем папку symbols, рядом папку background, и папку misc. Распихиваем по папкам картинки, запускаем скрипт и в папке output имеем три спрайтшита: symbols, background, misc.\

Парпметры:
---
- DETECT_ANIMATIONS - находит последовательности анимаций и добавляет их в json
- ALLOW_ROTATION - позволяет помещать изображение в спрайтшит повернутым на 90 градусов (для экономии размера)
- IMAGEMIN - сжимает png файл
- TINIFY_KEY - можно использовать tinify (если лень там регаться то в index.js есть мой ключ)
Ахтунг! Папки с именем начинающемся на точку будут проигнорированны.\
пример:
```
cross-env DETECT_ANIMATIONS=1 ALLOW_ROTATION=0 node index
```
Если windows не хочет запускать cross-env по соображениям безопасности то запустить:\
```
Set-ExecutionPolicy -Scope CurrentUser Bypass -Force
```