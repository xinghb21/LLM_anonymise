with open ('./data.csv', 'r', encoding='gbk') as f:
    data = f.read()
    data = data.split('\n')
    header = data[0]
    students = data[1:]
    total_students = len(students)

header = header.split('Q2_')[1:]
classes = []
for header_item in header:
    header_item = header_item.split('_')[1].split(',')[0]
    classes.append(header_item)

privacy = []
utility = []
num_students = 0
num_classes = len(classes)

privs = []
posses = []
utils = []

for student in students:
    stu_data = student.split(',')
    stu_data = stu_data[19:]
    priv = stu_data[0:num_classes]
    poss = stu_data[num_classes:2*num_classes]
    util = stu_data[2*num_classes:3*num_classes]
    if (priv[0] != ''):
        privs.append(priv)
    if (poss[0] != ''):
        posses.append(poss)
    if (util[0] != ''):
        utils.append(util)

for i in range(num_classes):
    privacy.append(0)
    utility.append(0)

for i in range(len(privs)):
    for j in range(num_classes):
        if (privs[i][j] == ''):
            continue
        privacy[j] += float(privs[i][j]) / len(privs)

for i in range(len(utils)):
    for j in range(num_classes):
        utility[j] += float(utils[i][j]) / len(utils)

privacy = [round(i, 2) for i in privacy]
utility = [round(i, 2) for i in utility]

import matplotlib.pyplot as plt

plt.figure(figsize=(10, 5))
plt.scatter(privacy, utility)
plt.xlabel('Privacy')
plt.ylabel('Utility')
plt.show()

with open('./result.txt', 'w') as f:
    data = []
    for i in range(num_classes):
        data.append([privacy[i], utility[i]])
    import json
    json.dump(data, f)