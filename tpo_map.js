// JSON map for tipitakapali.org

const fs = require("fs")
const path = require("path")

const CVT = require("./script/paliscriptconverter")

const OUTPUTDIR = "output"

if (!fs.existsSync(OUTPUTDIR)) {
  fs.mkdirSync(OUTPUTDIR)
}

function toTitleCase(str) {
  if (!str) {
    return ""
  }
  str = str.replaceAll("/", " > ").replaceAll('"', ' " ')

  const words = str.toLowerCase().split(" ")
  const titleCaseWords = words.map((word) => {
    if (word.length > 0) {
      return word.charAt(0).toUpperCase() + word.slice(1)
    } else {
      return word
    }
  })

  return titleCaseWords.join(" ").replaceAll(" > ", " > ").replaceAll(' " ', '"').replaceAll("· ", ".").replaceAll(".>", ". >")
}

function fromToThisPaliScr2Char(paliText, fromScript = "hi", targetScript = "ro") {
  if (typeof CVT === "undefined" || !CVT.TextProcessor) {
    return paliText
  }
  const sinh = CVT.TextProcessor.convertToSinh(paliText, CVT.Script[fromScript.toUpperCase()])
  if (targetScript == "si") return sinh
  return toTitleCase(CVT.TextProcessor.convertFromSinh(sinh, CVT.Script[targetScript.toUpperCase()]))
}

function saveJsonTpo(includeNavTitle = false) {
  try {
    const temp2_filename = path.join(OUTPUTDIR, "temp2_filename.json")

    const book2Data = fs.readFileSync(temp2_filename, "utf8")
    const books = JSON.parse(book2Data)

    for (const book of books) {
      if (book["LongNavPath"]) {
        book["LongNavPath"] = fromToThisPaliScr2Char(book["LongNavPath"], "hi", "ro")
      }
      if (book["ShortNavPath"]) {
        book["ShortNavPath"] = fromToThisPaliScr2Char(book["ShortNavPath"], "hi", "ro")
      }
      // delete book["Index"];
    }

    const bookString = JSON.stringify(books, null, 2)
    const booksFilename = path.join(OUTPUTDIR, "books.json")

    fs.writeFileSync(booksFilename, bookString, "utf8")

    const mapping = {}
    for (const book of books) {
      if (mapping[book["FileName"]]) {
        console.log("Stopped: Duplicate FileName:", book["FileName"])
        process.exit(1)
      }

      let curMap = (mapping[book["FileName"]] = {})
      if (includeNavTitle) {
        curMap.title = book["LongNavPath"]
      }

      curMap.matn = book["Matn"]

      curMap.y = "" // quickly check if the "jump is possible", y = "at" means Attha, Tika jump is possible

      if (book["MulaIndex"]) {
        curMap.m = book["MulaIndex"]
        curMap.y += "m"
      }
      if (book["AtthakathaIndex"]) {
        curMap.a = book["AtthakathaIndex"]
        curMap.y += "a"
      }
      if (book["TikaIndex"]) {
        curMap.t = book["TikaIndex"]
        curMap.y += "t"
      }
    }

    // add some manual mappings
    const finalMap = manualMapping(mapping)
    const updatedBook2Data = JSON.stringify(finalMap, null, 2)

    const jsFilename = path.join(OUTPUTDIR, "tpo_map.json")

    fs.writeFileSync(jsFilename, updatedBook2Data, "utf8")

    console.log(`${jsFilename}: saved successfully.`)
  } catch (error) {
    console.error(`Error processing ${temp2_filename}:`, error)
  }
}

function manualMapping(mapping) {
  // Añña > Visuddhimagga > Visuddhimagga-1
  mapping["e0101n.mul.xml"].y += "t"
  mapping["e0101n.mul.xml"].t = "e0103n.att.xml"

  // Añña > Visuddhimagga > Visuddhimagga-2
  mapping["e0102n.mul.xml"].y += "t"
  mapping["e0102n.mul.xml"].t = "e0104n.att.xml"

  // Añña > Visuddhimagga > Visuddhimagga-mahāṭīkā-1
  mapping["e0103n.att.xml"].y += "m"
  mapping["e0103n.att.xml"].m = "e0101n.mul.xml"

  // Añña > Visuddhimagga > Visuddhimagga-mahāṭīkā-2
  mapping["e0104n.att.xml"].y += "m"
  mapping["e0104n.att.xml"].m = "e0102n.mul.xml"

  return mapping
}

saveJsonTpo((includeNavTitle = true))
