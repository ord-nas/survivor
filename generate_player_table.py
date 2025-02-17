from passlib.hash import pbkdf2_sha256
import json

email_to_player = {
    "ryanoliverthomas@gmail.com": "Ryan T",
    "david.santana.montanez@gmail.com": "David Santana",
    "marcusbiwright@gmail.com": "Marcus",
    "zjleonard3@gmail.com": "Zachary",
    "bryhancoc@gmail.com": "Bryan",
    "mattchupack@gmail.com": "Matt C",
    "bertrand.t.cheng@gmail.com": "BERTRAND",
    "dawsonmcneillray@gmail.com": "Dawson",
    "musselman.deret@gmail.com": "Deret",
    "johnmsilva24@gmail.com": "John Silva",
    "rogersv6@gmail.com": "Vincent",
    "benlk92@gmail.com": "Benj",
    "williamsgrady@gmail.com": "Grady Williams",
    "young.sandro1@gmail.com": "Sandro",
    "tylerajdini13@gmail.com": "Ty",
    "codys015@gmail.com": "Cody Smith",
    "wyattmarkrobertson@gmail.com": "Wyatt Robertson",
    "erabek@gmail.com": "Eli",
    "ryangdoro@gmail.com": "Ryan Doro",
    "patrick.clarke01@gmail.com": "Patrick",
    "mjledbet@gmail.com": "Matt L",
    "yinweisoon@gmail.com": "Yinwei",
    "thejacobhenson@gmail.com": "Jacob",
    "iannally@gmail.com": "Ian Nally",
    "mitchell.car@gmail.com": "Mitchell",
    "mike92.gutierrez@gmail.com": "Mikey",
    "dillonrgrady@gmail.com": "Dillon",
    "alex.chibly@gmail.com": "Alex",
}

d = []
for (email, player) in email_to_player.items():
    d.append({
        "Username": player,
        "Email": email,
        "PasswordHash": pbkdf2_sha256.hash(player),
    })

print(json.dumps(d, indent=4))
