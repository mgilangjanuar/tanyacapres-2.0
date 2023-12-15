const raw = Bun.file('data/caleg/dpr/raw.json')
const data = JSON.parse(await raw.text()) as {
  region: string,
  raw: string,
  profile_id: string,
  html?: string
}[]

for (const item of data.filter(item => item.profile_id !== '-')) {
  const resp = await fetch('https://infopemilu.kpu.go.id/Pemilu/Dct_dpr/profile', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      id_calon_dpr: item.profile_id,
      status_publikasi: 'Bersedia'
    })
  })

  item.html = await resp.text()
}

await Bun.write('data/caleg/dpr/processed.json', JSON.stringify(data, null, 2))
