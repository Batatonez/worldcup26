"""Gera data/fwc26.json a partir do checklist (finalsticker) e da tabela de jogos (openfootball).

Uso: python3 tools/build_data.py
"""
import json
import os
import re
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "source")

# code: (iso, nome em inglês no álbum, nome PT, federação, confederação, nome no openfootball, cores)
# cores: c1 campo principal, c2 faixa de destaque, c3 faixa secundária, t1 "WE ARE", t2 nome da seleção
TEAMS = {
    "MEX": ("mx", "Mexico", "México", "Federación Mexicana de Fútbol Asociación, A.C.", "CONCACAF", "Mexico", ("#0b6b4b", "#d7262e", "#f2b8a0", "#0b6b4b", "#d7262e")),
    "RSA": ("za", "South Africa", "África do Sul", "South African Football Association", "CAF", "South Africa", ("#00774b", "#fdb913", "#e03c31", "#00774b", "#e8a400")),
    "KOR": ("kr", "Korea Republic", "Coreia do Sul", "Korea Football Association", "AFC", "South Korea", ("#c8102e", "#0047a0", "#f3b7c0", "#0047a0", "#c8102e")),
    "CZE": ("cz", "Czechia", "Tchéquia", "Fotbalová asociace České republiky", "UEFA", "Czech Republic", ("#11457e", "#d7141a", "#b9cbe3", "#11457e", "#d7141a")),
    "CAN": ("ca", "Canada", "Canadá", "Canadian Soccer Association", "CONCACAF", "Canada", ("#d52b1e", "#ef5a2a", "#d7df23", "#8b1a12", "#d52b1e")),
    "BIH": ("ba", "Bosnia-Herzegovina", "Bósnia e Herzegovina", "Nogometni/Fudbalski Savez Bosne i Hercegovine", "UEFA", "Bosnia & Herzegovina", ("#002395", "#fecb00", "#8ea4e6", "#002395", "#e2b400")),
    "QAT": ("qa", "Qatar", "Catar", "Qatar Football Association", "AFC", "Qatar", ("#8a1538", "#c04f72", "#e7c8d1", "#8a1538", "#8a1538")),
    "SUI": ("ch", "Switzerland", "Suíça", "Schweizerischer Fussballverband", "UEFA", "Switzerland", ("#d52b1e", "#a3161b", "#f3b3ad", "#a3161b", "#d52b1e")),
    "BRA": ("br", "Brazil", "Brasil", "Confederação Brasileira de Futebol", "CONMEBOL", "Brazil", ("#1f9b4a", "#f3c613", "#2a3f9b", "#1f9b4a", "#f3c613")),
    "MAR": ("ma", "Morocco", "Marrocos", "Fédération Royale Marocaine de Football", "CAF", "Morocco", ("#c1272d", "#006233", "#e9a89c", "#006233", "#c1272d")),
    "HAI": ("ht", "Haiti", "Haiti", "Fédération Haïtienne de Football", "CONCACAF", "Haiti", ("#00209f", "#d21034", "#8fa2e8", "#00209f", "#d21034")),
    "SCO": ("gb-sct", "Scotland", "Escócia", "Scottish Football Association", "UEFA", "Scotland", ("#0b2d6b", "#005eb8", "#a9c3e8", "#0b2d6b", "#005eb8")),
    "USA": ("us", "USA", "Estados Unidos", "United States Soccer Federation", "CONCACAF", "USA", ("#0a3161", "#b31942", "#9db4d6", "#0a3161", "#b31942")),
    "PAR": ("py", "Paraguay", "Paraguai", "Asociación Paraguaya de Fútbol", "CONMEBOL", "Paraguay", ("#d52b1e", "#0038a8", "#f2b1ab", "#0038a8", "#d52b1e")),
    "AUS": ("au", "Australia", "Austrália", "Football Australia", "AFC", "Australia", ("#00843d", "#ffcd00", "#9fd6b0", "#00843d", "#e8b800")),
    "TUR": ("tr", "Türkiye", "Turquia", "Türkiye Futbol Federasyonu", "UEFA", "Turkey", ("#e30a17", "#9e0b14", "#f5b5b8", "#9e0b14", "#e30a17")),
    "GER": ("de", "Germany", "Alemanha", "Deutscher Fußball-Bund", "UEFA", "Germany", ("#1a1a1a", "#dd0000", "#ffce00", "#1a1a1a", "#dd0000")),
    "CUW": ("cw", "Curaçao", "Curaçao", "Federashon Futbòl Kòrsou", "CONCACAF", "Curaçao", ("#002b7f", "#f9e814", "#7f9be0", "#002b7f", "#002b7f")),
    "CIV": ("ci", "Côte d'Ivoire", "Costa do Marfim", "Fédération Ivoirienne de Football", "CAF", "Ivory Coast", ("#f77f00", "#009e60", "#ffc58a", "#009e60", "#f77f00")),
    "ECU": ("ec", "Ecuador", "Equador", "Federación Ecuatoriana de Fútbol", "CONMEBOL", "Ecuador", ("#034ea2", "#ffd100", "#ed1c24", "#034ea2", "#e0b400")),
    "NED": ("nl", "Netherlands", "Holanda", "Koninklijke Nederlandse Voetbalbond", "UEFA", "Netherlands", ("#f36c21", "#21468b", "#ffc49e", "#21468b", "#f36c21")),
    "JPN": ("jp", "Japan", "Japão", "Japan Football Association", "AFC", "Japan", ("#0d2c6c", "#bc002d", "#9cb2dd", "#0d2c6c", "#bc002d")),
    "SWE": ("se", "Sweden", "Suécia", "Svenska Fotbollförbundet", "UEFA", "Sweden", ("#006aa7", "#fecc02", "#8cc3e3", "#006aa7", "#e8b800")),
    "TUN": ("tn", "Tunisia", "Tunísia", "Fédération Tunisienne de Football", "CAF", "Tunisia", ("#e70013", "#9c000d", "#f6a9ae", "#9c000d", "#e70013")),
    "BEL": ("be", "Belgium", "Bélgica", "Koninklijke Belgische Voetbalbond", "UEFA", "Belgium", ("#c8102e", "#1a1a1a", "#fdda24", "#1a1a1a", "#c8102e")),
    "EGY": ("eg", "Egypt", "Egito", "Egyptian Football Association", "CAF", "Egypt", ("#ce1126", "#1a1a1a", "#c09300", "#1a1a1a", "#ce1126")),
    "IRN": ("ir", "IR Iran", "Irã", "Football Federation Islamic Republic of Iran", "AFC", "Iran", ("#239f40", "#da0000", "#a7dcb3", "#239f40", "#da0000")),
    "NZL": ("nz", "New Zealand", "Nova Zelândia", "New Zealand Football", "OFC", "New Zealand", ("#1a1a1a", "#00247d", "#c8c8c8", "#1a1a1a", "#00247d")),
    "ESP": ("es", "Spain", "Espanha", "Real Federación Española de Fútbol", "UEFA", "Spain", ("#c60b1e", "#ffc400", "#f4aab2", "#c60b1e", "#e8b000")),
    "CPV": ("cv", "Cabo Verde", "Cabo Verde", "Federação Cabo-Verdiana de Futebol", "CAF", "Cape Verde", ("#003893", "#cf2027", "#f7d116", "#003893", "#cf2027")),
    "KSA": ("sa", "Saudi Arabia", "Arábia Saudita", "Saudi Arabian Football Federation", "AFC", "Saudi Arabia", ("#006c35", "#0a4d2a", "#a3d4b5", "#0a4d2a", "#006c35")),
    "URU": ("uy", "Uruguay", "Uruguai", "Asociación Uruguaya de Fútbol", "CONMEBOL", "Uruguay", ("#3f8fd2", "#1b2a5c", "#fcd116", "#1b2a5c", "#3f8fd2")),
    "FRA": ("fr", "France", "França", "Fédération Française de Football", "UEFA", "France", ("#002654", "#ed2939", "#9db3d9", "#002654", "#ed2939")),
    "SEN": ("sn", "Senegal", "Senegal", "Fédération Sénégalaise de Football", "CAF", "Senegal", ("#00853f", "#fdef42", "#e31b23", "#00853f", "#e31b23")),
    "IRQ": ("iq", "Iraq", "Iraque", "Iraq Football Association", "AFC", "Iraq", ("#007a3d", "#ce1126", "#1a1a1a", "#007a3d", "#ce1126")),
    "NOR": ("no", "Norway", "Noruega", "Norges Fotballforbund", "UEFA", "Norway", ("#ba0c2f", "#00205b", "#f2b0bd", "#00205b", "#ba0c2f")),
    "ARG": ("ar", "Argentina", "Argentina", "Asociación del Fútbol Argentino", "CONMEBOL", "Argentina", ("#5ea3de", "#1d3a6e", "#f6b40e", "#1d3a6e", "#5ea3de")),
    "ALG": ("dz", "Algeria", "Argélia", "Fédération Algérienne de Football", "CAF", "Algeria", ("#006233", "#d21034", "#a6d6b9", "#006233", "#d21034")),
    "AUT": ("at", "Austria", "Áustria", "Österreichischer Fußball-Bund", "UEFA", "Austria", ("#c8102e", "#8d0b20", "#f2b3bd", "#8d0b20", "#c8102e")),
    "JOR": ("jo", "Jordan", "Jordânia", "Jordan Football Association", "AFC", "Jordan", ("#ce1126", "#007a3d", "#1a1a1a", "#007a3d", "#ce1126")),
    "POR": ("pt", "Portugal", "Portugal", "Federação Portuguesa de Futebol", "UEFA", "Portugal", ("#9c0f1f", "#046a38", "#e7b6bc", "#046a38", "#c8102e")),
    "COD": ("cd", "Congo DR", "RD Congo", "Fédération Congolaise de Football-Association", "CAF", "DR Congo", ("#007fff", "#ce1021", "#f7d618", "#0b4fb3", "#ce1021")),
    "UZB": ("uz", "Uzbekistan", "Uzbequistão", "Uzbekistan Football Association", "AFC", "Uzbekistan", ("#0099b5", "#1eb53a", "#9fdbe6", "#0b6d82", "#1eb53a")),
    "COL": ("co", "Colombia", "Colômbia", "Federación Colombiana de Fútbol", "CONMEBOL", "Colombia", ("#003893", "#fcd116", "#ce1126", "#003893", "#e0b400")),
    "ENG": ("gb-eng", "England", "Inglaterra", "The Football Association", "UEFA", "England", ("#0b1f4b", "#ce1124", "#b9c4dc", "#0b1f4b", "#ce1124")),
    "CRO": ("hr", "Croatia", "Croácia", "Hrvatski nogometni savez", "UEFA", "Croatia", ("#d81e05", "#171796", "#f1b2a9", "#171796", "#d81e05")),
    "GHA": ("gh", "Ghana", "Gana", "Ghana Football Association", "CAF", "Ghana", ("#006b3f", "#fcd116", "#ce1126", "#006b3f", "#ce1126")),
    "PAN": ("pa", "Panama", "Panamá", "Federación Panameña de Fútbol", "CONCACAF", "Panama", ("#d21034", "#005293", "#f1aab5", "#005293", "#d21034")),
}

HOSTS = {"MEX", "USA", "CAN"}

# Estádios como aparecem no álbum ("<Cidade> Stadium")
VENUES = {
    "Atlanta": "Atlanta Stadium",
    "Boston (Foxborough)": "Boston Stadium",
    "Dallas (Arlington)": "Dallas Stadium",
    "Guadalajara (Zapopan)": "Guadalajara Stadium",
    "Houston": "Houston Stadium",
    "Kansas City": "Kansas City Stadium",
    "Los Angeles (Inglewood)": "Los Angeles Stadium",
    "Mexico City": "Mexico City Stadium",
    "Miami (Miami Gardens)": "Miami Stadium",
    "Monterrey (Guadalupe)": "Monterrey Stadium",
    "New York/New Jersey (East Rutherford)": "New York / New Jersey Stadium",
    "Philadelphia": "Philadelphia Stadium",
    "San Francisco Bay Area (Santa Clara)": "San Francisco Bay Area Stadium",
    "Seattle": "Seattle Stadium",
    "Toronto": "Toronto Stadium",
    "Vancouver": "BC Place Vancouver",
}

# FWC9–FWC19: campeões (para a página de história)
HISTORY = {
    "FWC9": ("Italy", 1934), "FWC10": ("Uruguay", 1950), "FWC11": ("West Germany", 1954),
    "FWC12": ("Brazil", 1962), "FWC13": ("West Germany", 1974), "FWC14": ("Argentina", 1986),
    "FWC15": ("Brazil", 1994), "FWC16": ("Brazil", 2002), "FWC17": ("Italy", 2006),
    "FWC18": ("Germany", 2014), "FWC19": ("Argentina", 2022),
}


def clean(name):
    return re.sub(r"[\U0001F000-\U0001FFFF]", "", name).strip()


def main():
    rows = json.load(open(os.path.join(SRC, "finalsticker-fwc26-standard.json"), encoding="utf-8"))
    base = [r for r in rows if not r["extra"]]
    assert len(base) == 980, len(base)

    stickers = []
    for r in base:
        code = r["code"]
        m = re.match(r"([A-Z]+)(\d+)$", code)
        prefix, num = (m.group(1), int(m.group(2))) if m else (code, 0)
        foil = r["finish"] == "glitzer"
        if code == "00":
            kind = "special"
        elif prefix == "FWC":
            kind = "special"
        elif num == 1:
            kind = "badge"
        elif num == 13:
            kind = "team"
        else:
            kind = "player"
        name = clean(r["name"])
        if kind == "badge":
            name = "Emblem"
        elif kind == "team":
            name = "Team Photo"
        stickers.append({"code": code, "prefix": prefix, "num": num, "name": name, "kind": kind, "foil": foil})

    of = json.load(open(os.path.join(SRC, "openfootball-worldcup-2026.json"), encoding="utf-8"))
    by_of = {v[5]: k for k, v in TEAMS.items()}
    groups = {}
    fixtures = {k: [] for k in TEAMS}
    for mt in of["matches"]:
        g = mt.get("group")
        if not g:
            continue
        letter = g.split()[-1]
        a, b = by_of[mt["team1"]], by_of[mt["team2"]]
        groups.setdefault(letter, [])
        for t in (a, b):
            if t not in groups[letter]:
                groups[letter].append(t)
        d = date.fromisoformat(mt["date"])
        label = f"{d.strftime('%A')}, {d.day} {d.strftime('%B')}"
        item = {"date": mt["date"], "label": label, "venue": VENUES[mt["ground"]], "home": a, "away": b}
        fixtures[a].append(item)
        fixtures[b].append(item)

    teams = []
    order = []
    for s in stickers:
        if s["kind"] == "badge":
            order.append(s["prefix"])
    for code in order:
        iso, en, pt, fed, conf, _, colors = TEAMS[code]
        group = next(k for k, v in groups.items() if code in v)
        teams.append({
            "code": code, "iso": iso, "en": en, "pt": pt, "fed": fed, "conf": conf,
            "host": code in HOSTS, "group": group, "colors": list(colors),
            "fixtures": sorted(fixtures[code], key=lambda f: f["date"]),
        })

    # Ordem dos grupos segue a ordem do álbum
    group_list = {}
    for t in teams:
        group_list.setdefault(t["group"], []).append(t["code"])

    out = {
        "stickers": stickers,
        "teams": teams,
        "groups": group_list,
        "history": {k: {"country": v[0], "year": v[1]} for k, v in HISTORY.items()},
    }
    path = os.path.join(ROOT, "data", "fwc26.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print("ok", path, len(stickers), "stickers,", len(teams), "teams,", len(group_list), "groups")


if __name__ == "__main__":
    main()
