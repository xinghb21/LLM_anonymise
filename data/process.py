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
num_students = len(students)
num_classes = len(classes)

for student in students:
    stu_data = student.split(',')
    stu_data = stu_data[19:]
    priv = stu_data[0:num_classes]
    poss = stu_data[num_classes:2*num_classes]
    util = stu_data[2*num_classes:3*num_classes]
    for i in range(num_classes):
        if poss[i] == '' or float(poss[i]) == 0:
            continue
        if util[i] == '':
            util[i] = 0
        if len(privacy) < num_classes:
            privacy.append(float(priv[i]) / num_students)
            utility.append(float(util[i]) / num_students)
        else:
            privacy[i] += float(priv[i]) / num_students
            utility[i] += float(util[i]) / num_students

privacy = [round(i, 2) for i in privacy]
utility = [round(i, 2) for i in utility]

import matplotlib.pyplot as plt
import numpy as np

x = np.array(privacy)
y = np.array(utility)

plt.figure()
plt.scatter(x, y)
plt.show()

with open('./result.txt', 'w') as f:
    data = []
    for i in range(num_classes):
        data.append([privacy[i], utility[i]])
    import json
    json.dump(data, f)