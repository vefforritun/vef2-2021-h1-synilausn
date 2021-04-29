# Tests

Keyrir integration test á móti API fyrir hvert route, reynir að grípa flest allt.

Flest test eru nokkuð sjálfskjalandi en í grunninn:

* Sækja gögn í API með hjálparföllum í `./utils.js`
* Staðfesta að form gagna sé eins og við búumst við
* Ef einhver notanda/stjórnanda aðgerð, passa að auðkenning sé í lagi
  * Skrá sig inn með ný útbúnum notanda og prófa virkni almenns notanda
  * Skrá sig inn með harðkóðuðum stjórnanda og prófa virkni stjórnanda

Þar sem við vitum ekki nákvæmlega hvaða gögn eru hvar, þá er ekki athugað að titill sé nákvæmlega einhver, heldur að það sé titill.

Eftir keyrslur á testum er fullt af „rusl“ gögnum í gagnagrunni svo keyra ætti aðeins á testþjóni með testgagnagrunni.

## Harðkóðaður admin

Notum harðkóðaðann admin notanda til að geta keyrt test. Í raunveruleikanum gætum við gert þetta, _en_ það skilur eftir hættu á því að þessum notanda væri ekki eytt.
