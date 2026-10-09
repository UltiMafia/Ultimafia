import sys, collections
sys.path.insert(0, "/home/tt/Documents/Ultimafia/rules_ml")
import export_final2 as E

texts = ["Lowk superhero looks like sinister mark",
         "you are such a moron!!",
         "i'm suing lol",
         "Don't  do   that",
         "he said \u201chello\u201d  ok"]
v = E.make_vec("char")
sk_an = v.build_analyzer()
for t in texts:
    a = sk_an(t)
    b = E.tok_char_wb(t, 2, 5)
    ca, cb = collections.Counter(a), collections.Counter(b)
    same = ca == cb
    print("%-40r same=%s sk=%d mine=%d" % (t[:38], same, len(a), len(b)))
    if not same:
        only_sk = list((ca - cb).items())[:6]
        only_me = list((cb - ca).items())[:6]
        print("    only sklearn:", only_sk)
        print("    only mine   :", only_me)
