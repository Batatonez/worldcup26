#!/usr/bin/env python3
"""Gera js/data.js a partir de data/checklist.csv e data/worldcup.json.

Uso: python3 scripts/build_data.py

Fontes:
- data/checklist.csv: checklist Panini FIFA World Cup 2026 (980 figurinhas base + 12 Coca-Cola),
  conferido contra uma segunda lista independente (mesma ordem em todas as seleções).
- data/worldcup.json: tabela de jogos do openfootball/worldcup.json (domínio público).
"""
import csv
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# code: (iso da bandeira, nome em inglês como no álbum, nome em português, confederação, cor 1, cor 2)
TEAMS = {
    "MEX": ("mx", "Mexico", "México", "CONCACAF", "#006847", "#CE1126"),
    "RSA": ("za", "South Africa", "África do Sul", "CAF", "#007749", "#FFB81C"),
    "KOR": ("kr", "Korea Republic", "Coreia do Sul", "AFC", "#0047A0", "#CD2E3A"),
    "CZE": ("cz", "Czechia", "Tchéquia", "UEFA", "#11457E", "#D7141A"),
    "CAN": ("ca", "Canada", "Canadá", "CONCACAF", "#D52B1E", "#1A1A1A"),
    "BIH": ("ba", "Bosnia and Herzegovina", "Bósnia e Herzegovina", "UEFA", "#002395", "#FECB00"),
    "QAT": ("qa", "Qatar", "Catar", "AFC", "#8A1538", "#E9E2D6"),
    "SUI": ("ch", "Switzerland", "Suíça", "UEFA", "#D52B1E", "#1A1A1A"),
    "BRA": ("br", "Brazil", "Brasil", "CONMEBOL", "#009739", "#FEDD00"),
    "MAR": ("ma", "Morocco", "Marrocos", "CAF", "#C1272D", "#006233"),
    "HAI": ("ht", "Haiti", "Haiti", "CONCACAF", "#00209F", "#D21034"),
    "SCO": ("gb-sct", "Scotland", "Escócia", "UEFA", "#0065BF", "#1C2541"),
    "USA": ("us", "USA", "Estados Unidos", "CONCACAF", "#0A3161", "#B31942"),
    "PAR": ("py", "Paraguay", "Paraguai", "CONMEBOL", "#0038A8", "#D52B1E"),
    "AUS": ("au", "Australia", "Austrália", "AFC", "#00843D", "#FFCD00"),
    "TUR": ("tr", "Türkiye", "Turquia", "UEFA", "#E30A17", "#1A1A1A"),
    "GER": ("de", "Germany", "Alemanha", "UEFA", "#1A1A1A", "#DD0000"),
    "CUW": ("cw", "Curaçao", "Curaçao", "CONCACAF", "#002B7F", "#F9E814"),
    "CIV": ("ci", "Côte d'Ivoire", "Costa do Marfim", "CAF", "#F77F00", "#009E60"),
    "ECU": ("ec", "Ecuador", "Equador", "CONMEBOL", "#0072CE", "#FFD100"),
    "NED": ("nl", "Netherlands", "Holanda", "UEFA", "#F36C21", "#21468B"),
    "JPN": ("jp", "Japan", "Japão", "AFC", "#0B1F65", "#BC002D"),
    "SWE": ("se", "Sweden", "Suécia", "UEFA", "#006AA7", "#FECC00"),
    "TUN": ("tn", "Tunisia", "Tunísia", "CAF", "#E70013", "#1A1A1A"),
    "BEL": ("be", "Belgium", "Bélgica", "UEFA", "#E30613", "#FDDA24"),
    "EGY": ("eg", "Egypt", "Egito", "CAF", "#CE1126", "#1A1A1A"),
    "IRN": ("ir", "IR Iran", "Irã", "AFC", "#239F40", "#DA0000"),
    "NZL": ("nz", "New Zealand", "Nova Zelândia", "OFC", "#1A1A1A", "#00247D"),
    "ESP": ("es", "Spain", "Espanha", "UEFA", "#AA151B", "#F1BF00"),
    "CPV": ("cv", "Cabo Verde", "Cabo Verde", "CAF", "#003893", "#CF2027"),
    "KSA": ("sa", "Saudi Arabia", "Arábia Saudita", "AFC", "#006C35", "#1A1A1A"),
    "URU": ("uy", "Uruguay", "Uruguai", "CONMEBOL", "#5CBFEB", "#0038A8"),
    "FRA": ("fr", "France", "França", "UEFA", "#002395", "#ED2939"),
    "SEN": ("sn", "Senegal", "Senegal", "CAF", "#00853F", "#FDEF42"),
    "IRQ": ("iq", "Iraq", "Iraque", "AFC", "#007A3D", "#CE1126"),
    "NOR": ("no", "Norway", "Noruega", "UEFA", "#BA0C2F", "#00205B"),
    "ARG": ("ar", "Argentina", "Argentina", "CONMEBOL", "#75AADB", "#1C2541"),
    "ALG": ("dz", "Algeria", "Argélia", "CAF", "#007A3D", "#D21034"),
    "AUT": ("at", "Austria", "Áustria", "UEFA", "#ED2939", "#1A1A1A"),
    "JOR": ("jo", "Jordan", "Jordânia", "AFC", "#007A3D", "#CE1126"),
    "POR": ("pt", "Portugal", "Portugal", "UEFA", "#006600", "#DA291C"),
    "COD": ("cd", "Congo DR", "RD Congo", "CAF", "#007FFF", "#CE1021"),
    "UZB": ("uz", "Uzbekistan", "Uzbequistão", "AFC", "#0099B5", "#1EB53A"),
    "COL": ("co", "Colombia", "Colômbia", "CONMEBOL", "#FCD116", "#003893"),
    "ENG": ("gb-eng", "England", "Inglaterra", "UEFA", "#1C2541", "#CF081F"),
    "CRO": ("hr", "Croatia", "Croácia", "UEFA", "#FF0000", "#171796"),
    "GHA": ("gh", "Ghana", "Gana", "CAF", "#006B3F", "#FCD116"),
    "PAN": ("pa", "Panama", "Panamá", "CONCACAF", "#005293", "#DA121A"),
}

# nome usado no worldcup.json -> código
JSON_NAMES = {
    "Mexico": "MEX", "South Africa": "RSA", "South Korea": "KOR", "Czech Republic": "CZE",
    "Canada": "CAN", "Bosnia & Herzegovina": "BIH", "Qatar": "QAT", "Switzerland": "SUI",
    "Brazil": "BRA", "Morocco": "MAR", "Haiti": "HAI", "Scotland": "SCO",
    "USA": "USA", "Paraguay": "PAR", "Australia": "AUS", "Turkey": "TUR",
    "Germany": "GER", "Curaçao": "CUW", "Ivory Coast": "CIV", "Ecuador": "ECU",
    "Netherlands": "NED", "Japan": "JPN", "Sweden": "SWE", "Tunisia": "TUN",
    "Belgium": "BEL", "Egypt": "EGY", "Iran": "IRN", "New Zealand": "NZL",
    "Spain": "ESP", "Cape Verde": "CPV", "Saudi Arabia": "KSA", "Uruguay": "URU",
    "France": "FRA", "Senegal": "SEN", "Iraq": "IRQ", "Norway": "NOR",
    "Argentina": "ARG", "Algeria": "ALG", "Austria": "AUT", "Jordan": "JOR",
    "Portugal": "POR", "DR Congo": "COD", "Uzbekistan": "UZB", "Colombia": "COL",
    "England": "ENG", "Croatia": "CRO", "Ghana": "GHA", "Panama": "PAN",
}

# nome do estádio como impresso no álbum
STADIUMS = {
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
    "New York/New Jersey (East Rutherford)": "New York New Jersey Stadium",
    "Philadelphia": "Philadelphia Stadium",
    "San Francisco Bay Area (Santa Clara)": "San Francisco Bay Area Stadium",
    "Seattle": "Seattle Stadium",
    "Toronto": "Toronto Stadium",
    "Vancouver": "BC Place Vancouver",
}

HOSTS = {
    "CAN": ["Toronto", "Vancouver"],
    "MEX": ["Guadalajara", "Mexico City", "Monterrey"],
    "USA": ["Atlanta", "Boston", "Dallas", "Houston", "Kansas City", "Los Angeles",
            "Miami", "New York New Jersey", "Philadelphia", "San Francisco Bay Area", "Seattle"],
}

WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
MONTHS = {"06": "June", "07": "July"}


def fmt_date(iso):
    import datetime
    y, m, d = (int(x) for x in iso.split("-"))
    wd = WEEKDAYS[datetime.date(y, m, d).weekday()]
    return f"{wd}, {d} {MONTHS[iso[5:7]]}"


def main():
    rows = list(csv.DictReader(open(os.path.join(ROOT, "data/checklist.csv"), encoding="utf-8")))
    stickers = []
    for r in rows:
        code = r["Sticker ID"].lstrip("'").strip()
        if code == "FWC00":
            code = "00"
        kind = {"Intro": "intro", "History": "history", "Badge": "badge", "Photo": "photo",
                "Player": "player", "Coca-Cola Star": "coke"}[r["Type"]]
        name = r["Name/Description"].strip()
        if kind == "badge":
            name = "Escudo"
        elif kind == "photo":
            name = "Foto do time"
        elif kind == "history":
            name = re.sub(r"^Past Champions: | - World Cup History$", "", name)
        elif kind == "intro":
            name = {
                "00": "Panini", "FWC1": "Emblema oficial", "FWC2": "Emblema oficial",
                "FWC3": "Mascotes oficiais", "FWC4": "Slogan oficial", "FWC5": "Bola oficial",
                "FWC6": "Canadá", "FWC7": "México", "FWC8": "Estados Unidos",
            }[code]
        item = {"c": code, "n": name, "k": kind}
        if kind == "coke":
            item["t"] = r["Country/Category"].strip()
        stickers.append(item)

    base = [s for s in stickers if s["k"] != "coke"]
    assert len(base) == 980, len(base)
    assert len({s["c"] for s in stickers}) == len(stickers)

    games = json.load(open(os.path.join(ROOT, "data/worldcup.json"), encoding="utf-8"))["matches"]
    groups = {}
    team_games = {c: [] for c in TEAMS}
    for g in games:
        if "group" not in g:
            continue
        letter = g["group"].split()[-1]
        a, b = JSON_NAMES[g["team1"]], JSON_NAMES[g["team2"]]
        for t in (a, b):
            groups.setdefault(letter, [])
            if t not in groups[letter]:
                groups[letter].append(t)
        m = {"d": fmt_date(g["date"]), "h": a, "a": b, "v": STADIUMS[g["ground"]]}
        team_games[a].append(m)
        team_games[b].append(m)

    order = [c for L in sorted(groups) for c in groups[L]]
    assert order == list(TEAMS), "ordem das seleções diferente da tabela"
    for c in TEAMS:
        assert [s["c"] for s in base if re.fullmatch(c + r"\d+", s["c"])] == [f"{c}{i}" for i in range(1, 21)], c

    teams = []
    for c, (iso, en, pt, conf, c1, c2) in TEAMS.items():
        letter = next(L for L in groups if c in groups[L])
        teams.append({"c": c, "iso": iso, "en": en, "pt": pt, "conf": conf, "c1": c1, "c2": c2,
                      "g": letter, "games": team_games[c]})

    out = {
        "stickers": stickers,
        "teams": teams,
        "groups": groups,
        "hosts": HOSTS,
    }
    js = "/* Gerado por scripts/build_data.py. Não editar à mão. */\nwindow.WC = " + \
        json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
    open(os.path.join(ROOT, "js/data.js"), "w", encoding="utf-8").write(js)
    print(f"{len(stickers)} figurinhas, {len(teams)} seleções -> js/data.js")


if __name__ == "__main__":
    main()
