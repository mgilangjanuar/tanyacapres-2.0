const raw = Bun.file('data/caleg/dpd/processed.json')
await Bun.write('data/caleg/dpd/processed.min.json', JSON.stringify(JSON.parse(await raw.text())))

const raw2 = Bun.file('data/caleg/dpd/clean.json')
await Bun.write('data/caleg/dpd/clean.min.json', JSON.stringify(JSON.parse(await raw2.text())))

const raw3 = Bun.file('data/caleg/dpr/processed.json')
await Bun.write('data/caleg/dpr/processed.min.json', JSON.stringify(JSON.parse(await raw3.text())))

const raw4 = Bun.file('data/caleg/dpr/clean.json')
await Bun.write('data/caleg/dpr/clean.min.json', JSON.stringify(JSON.parse(await raw4.text())))
