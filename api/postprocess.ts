const raw = Bun.file('data/caleg/dpr/processed.json')
const data = JSON.parse(await raw.text()) as {
  region: string,
  raw?: string,
  profile_id?: string,
  html?: string,
  profile?: {
    party?: string,
    photo?: string,
    name?: string,
    number?: string,
    gender?: string,
    city?: string
  },
  details?: {
    job?: string,
    address?: string,
    law_status?: string,
    experiences?: {
      company?: string,
      position?: string,
      startYear?: string,
      endYear?: string
    }[],
    educations?: {
      school?: string,
      major?: string,
      startYear?: string,
      endYear?: string
    }[],
    organizations?: {
      name?: string,
      position?: string,
      startYear?: string,
      endYear?: string
    }[],
    courses?: {
      name?: string,
      organizer?: string,
      startYear?: string,
      endYear?: string
    }[],
    awards?: {
      name?: string,
      organizer?: string,
      year?: string
    }[],
    missions?: string[],
  }
}[]

for (const item of data) {
  if (item.raw) {
    item.profile = {
      party: item.raw.split('.png\" width=\"30\">')[1].split('</td>')[0].trim(),
      number: item.raw.split('nomor urut</i><br><b><font size=\"3\">')[1].split('</font>')[0],
      name: item.raw.split('loading=\"lazy\"></center></td><td>')[1].split('</td>')[0],
      gender: item.raw.split('</td><td>')[5].split('</td>')[0],
      city: item.raw.split('</td><td>')[6].split('</td>')[0],
      photo: item.raw.split('</center></td><td><center><img src=\"')[1].split('\"')[0],
    }
    item.raw = undefined
  }
  if (item.html) {
    item.details = {
      job: item.html.split('PEKERJAAN</h3><p>')?.[1]?.split('</p>')?.[0]?.trim() || '',
      address: item.html.split('ALAMAT</h3>')?.[1]?.split('</div><div class=\"container table-')?.[0]?.trim()?.split('<li class=\"list-group-item\">').map(item => item.split('</li>')?.[0]?.replace('<strong>', '')?.replace('</strong>', '')).join('\n')?.trim() || '',
      law_status: item.html.split('STATUS HUKUM</h3><p>')?.[1]?.split('</p>')?.[0]?.trim() || '',
      experiences: item.html.split('RIWAYAT PEKERJAAN</h3><table class=\"table table-bordered\"><thead><tr><th>Nama Perusahaan / Lembaga</th><th>Jabatan</th><th>Tahun Masuk</th><th>Tahun Keluar</th></tr></thead><tbody>')?.[1]?.split('</tbody>')?.[0]?.trim().split('<tr>').map((item) => {
        item = item.trim()
        return {
          name: item.split('</td>')?.[0]?.split('<td>')?.[1]?.trim(),
          position: item.split('</td>')?.[1]?.split('<td>')?.[1]?.trim(),
          startYear: item.split('</td>')?.[2]?.split('<td>')?.[1]?.trim(),
          endYear: item.split('</td>')?.[3]?.split('<td>')?.[1]?.trim(),
        }
      }).filter((item) => !!item.name) || [],
      educations: item.html.split('RIWAYAT PENDIDIKAN</h3><table class=\"table table-bordered\"><thead><tr><th>Jenjang Pendidikan</th><th>Nama Institusi</th><th>Tahun Masuk</th><th>Tahun Keluar</th></tr></thead><tbody>')?.[1]?.split('</tbody>')?.[0]?.trim().split('<tr>').map((item) => {
        item = item.trim()
        return {
          name: item.split('</td>')?.[0]?.split('<td>')?.[1]?.trim(),
          major: item.split('</td>')?.[1]?.split('<td>')?.[1]?.trim(),
          startYear: item.split('</td>')?.[2]?.split('<td>')?.[1]?.trim(),
          endYear: item.split('</td>')?.[3]?.split('<td>')?.[1]?.trim(),
        }
      }).filter((item) => !!item.name) || [],
      organizations: item.html.split('RIWAYAT ORGANISASI</h3><table class=\"table table-bordered\"><thead><tr><th>Nama Organisasi</th><th>Jabatan</th><th>Tahun Masuk</th><th>Tahun Keluar</th></tr></thead><tbody>')?.[1]?.split('</tbody>')?.[0]?.trim().split('<tr>').map((item) => {
        item = item.trim()
        return {
          name: item.split('</td>')?.[0]?.split('<td>')?.[1]?.trim(),
          position: item.split('</td>')?.[1]?.split('<td>')?.[1]?.trim(),
          startYear: item.split('</td>')?.[2]?.split('<td>')?.[1]?.trim(),
          endYear: item.split('</td>')?.[3]?.split('<td>')?.[1]?.trim(),
        }
      }).filter((item) => !!item.name) || [],
      courses: item.html.split('RIWAYAT KURSUS DAN DIKLAT</h3><table class=\"table table-bordered\"><thead><tr><th>Nama Kursus</th><th>lembaga penyelenggara</th><th>nomor sertifikat</th><th>Tahun Masuk</th><th>Tahun Keluar</th></tr></thead><tbody>')?.[1]?.split('</tbody>')?.[0]?.trim().split('<tr>').map((item) => {
        item = item.trim()
        return {
          name: item.split('</td>')?.[0]?.split('<td>')?.[1]?.trim(),
          organizer: item.split('</td>')?.[1]?.split('<td>')?.[1]?.trim(),
          startYear: item.split('</td>')?.[2]?.split('<td>')?.[1]?.trim(),
          endYear: item.split('</td>')?.[3]?.split('<td>')?.[1]?.trim(),
        }
      }).filter((item) => !!item.name || !!item.organizer) || [],
      awards: item.html.split('RIWAYAT PENGHARGAAN</h3><table class=\"table table-bordered\"><thead><tr><th>Nama Penghargaan</th><th>Lembaga</th><th>Tahun </th></tr></thead><tbody>')?.[1]?.split('</tbody>')?.[0]?.trim().split('<tr>').map((item) => {
        item = item.trim()
        return {
          name: item.split('</td>')?.[0]?.split('<td>')?.[1]?.trim(),
          organizer: item.split('</td>')?.[1]?.split('<td>')?.[1]?.trim(),
          year: item.split('</td>')?.[2]?.split('<td>')?.[1]?.trim(),
        }
      }).filter((item) => !!item.name || !!item.organizer) || [],
      missions: item.html.split('PROGRAM USULAN</h3>')?.[1]?.split('</div><div')?.[0]?.trim().split('<li class=\"list-group-item\"><strong>').map((item) => {
        item = item?.replace('</strong> </li>', '').trim()
        return item
      }).filter((item) => !!item) || [],
    }
    item.html = undefined
    item.profile_id = undefined
  }
}

await Bun.write('data/caleg/dpr/clean.json', JSON.stringify(data, null, 2))
