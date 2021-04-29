# Vefforritun 2, 2021, hópverkefni 1, sýnilausn

## Uppbygging verkefnis

* `/data`, gefin gögn fyrir sjónvarpsseríur
* `/sql`, scriptu til að útbúa gagnagrunn og notanda fyrir test
* `/src/api`, API fyrir sjónvarpsseríur, season, og þætti
* `/src/auth`, uppstilling á auðkenningu og API fyrir notendaumsjón
* `/src/data-setup`, virkni til að **útbúa** gögn í `/data`
* `/src/setup`, virkni til að keyra gögn úr `/data` inn í gagnagrunn
* `/src/tests`, „integration“ test fyrir allan API, sjá nánar í `readme` skrá möppu
* `/src/utils`, hjálparföll
* `/src/validation`, endurnýtanlegir validatorar og hjálparföll
* `/src/app.js`, express uppsetning
* `/src/db.js`, einhver gagnagrunnsköll og hjálparföll
* `/src/errors.js`, sértækar villur sem erfa `Error`

Að auki eru búnar til tímabundnar möppur:

* `/.cache`, cache af gögnum sem sótt eru í TMDB API til að útbúa gefin gögn
* `/temp`, temp gögn fyrir multer upload

All flestar skrár eru með athugasemdum um virkni.

Þónokkuð er um `TODO`, hluti sem höfundur rakst á/hafði ekki tíma til að laga meðan verið var að vinna verkefnið en væri góð hugmynd að líta betur á... á einhverjum tímapunkti.

Skjölun og athugasemdir eru líka í bland á íslensku og ensku ¯\_(ツ)_/¯

## Test

Sjá skjölun í [`/src/tests`](/src/tests/).

Uppsetning er þannig að hægt er að **eyða öllu** og keyra aftur inn gögn og keyra test.

`npm run setup` hendir alltaf öllum gagnagrunni, býr til aftur, og keyrir inn gögn frá grunni. Myndir eru ekki uploadaðar oft í Cloudinary heldur er athugað hvort þær séu til.

Til að keyra test á meðan verið er að þróa er hægt að nota:

```bash
npm run test -- --watch
```

## Logging

`winston` pakkinn er notaður fyrir logging

Log er skrifað út í stdout/sterr ásamt því að fara í `app.log` og `debug.log` ef `LOG_LEVEL` er `verbose`.

## Keyra verkefni

```bash
createdb vef2-2021-h1
# uppfæra env
npm run setup # býr til gagnagrunn, fyllir af gögnum, og sendir myndir á cloudinary
npm run dev # keyrir upp dev
npm run test # staðfestir virkni með testum
```
