import json, datetime
from collections import defaultdict
import inspect

def parse_dtjs(dtjs):
    # Fri Mar 10 2017 03:24:08 GMT+0900 (KST)
    dtjs = dtjs.split(" (")[0]
    dtp_pattern = "%a %b %d %Y %H:%M:%S %Z%z"
    dtp_obj = datetime.datetime.strptime(dtjs, dtp_pattern)
    return dtp_obj

DT_44 = parse_dtjs("Tue Apr 04 2017 00:00:00 GMT+0900 (KST)")

def get_timeslot_dist(_js):
    users = _js["users"]
    dist = []
    for (dt, dtjs) in users.items():
        for (uid, ujs) in dtjs.items():
            if not "conn" in uid:
                time = parse_dtjs(ujs["time"])
                if time >= DT_44:
                    dist.append(time.hour)
    return { hour : dist.count(hour) for hour in dist }

def bname(bldg_list, idx):
    return bldg_list[idx]["name"]

def get_avg_speed_by_bldg(_js):
    bldg_list = _js["bldg"]
    users = _js["users"]
    sum_dict = defaultdict(lambda: {
        "cnt": 0,
        "sum_download": 0,
        "sum_upload": 0,
        "sum_speed": 0,
    })

    for (dt, dtjs) in users.items():
        for (uid, ujs) in dtjs.items():
            time = parse_dtjs(ujs["time"])
            if not "conn" in uid and time >= DT_44:
                try:
                    download = float(ujs["download"])
                    upload = float(ujs["upload"])
                    speed = int(ujs["speed"])
                    bidx = int(ujs["bldg"])
                    btype = ujs["type"]
                    bkey = bname(bldg_list, bidx) + "_" + btype
                    x = sum_dict[bkey]
                    x["cnt"] += 1
                    x["sum_download"] += download
                    x["sum_upload"] += upload
                    x["sum_speed"] += speed
                    sum_dict[bkey] = x
                except:
                    pass

    return {
        bname: {
            "avg_download": x["sum_download"]/x["cnt"],
            "avg_upload": x["sum_upload"]/x["cnt"],
            "avg_speed": x["sum_speed"]/x["cnt"],
        } for (bname, x) in sum_dict.items() if not x["cnt"] == 0
    }


def total(uid, ujs):
    return True

def not_connect(uid, ujs):
    return "conn" in uid

def get_num_of_sig(_js, cond_func):
    users = _js["users"]
    sig_list = []
    for (dt, dtjs) in users.items():
        for (uid, ujs) in dtjs.items():
            time = parse_dtjs(ujs["time"])
            if time >= DT_44 and cond_func(uid, ujs):
                sig_list.append(ujs)
    return len(sig_list)

def get_num_of_sig_by_bldg(_js):
    bldg_list = _js["bldg"]
    users = _js["users"]
    num_dict = defaultdict(int)

    for (dt, dtjs) in users.items():
        for (uid, ujs) in dtjs.items():
            time = parse_dtjs(ujs["time"])
            if time >= DT_44:
                bidx = int(ujs["bldg"])
                num_dict[bname(bldg_list, bidx)] += 1
    return num_dict

def main():
    jf = open("hello-3239c-export(12).json")
    js = json.loads(jf.read())

    td = get_timeslot_dist(js)
    asbd = get_avg_speed_by_bldg(js)
    nots = get_num_of_sig(js, total)
    noncs = get_num_of_sig(js, not_connect)
    nosbd = get_num_of_sig_by_bldg(js)

    o = open("result.csv", "w")
    c = ","

    o.write("== timeslot_distribution ==\n")
    for h in range(24):
        try:
            o.write(c.join([str(h), str(td[h]), "\n"]))
        except:
            o.write(c.join([str(h), str(0), "\n"]))

    o.write("\n== avg_speed_by_bldg ==\n")
    header = ["avg_download", "avg_upload", "avg_speed"]
    o.write(c.join([""] + header + ["\n"]))
    for bldg, bldgjs in asbd.items():
        o.write(c.join([bldg] + [str(bldgjs[h]) for h in header] + ["\n"]))

    o.write("\n== num_of_total_sig ==\n")
    o.write(c.join([str(nots), "\n"]))

    o.write("\n== num_of_not_connect_sig ==\n")
    o.write(c.join([str(noncs), "\n"]))

    o.write("\n== num_of_sig_by_bldg ==\n")
    for bldg, num in nosbd.items():
        o.write(c.join([bldg, str(num), "\n"]))

    o.close()

def run(func):
    print("..start..")
    func()
    print("...end...")

if __name__ == "__main__":
    run(main)
