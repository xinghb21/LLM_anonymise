// 获取选中的文字的范围和位置信息
function getSelectionCoordinates() {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).cloneRange();
    const rect = range.getBoundingClientRect();
    return rect;
}
  
  // 创建悬浮框
function createFloatingBox(selectedText, mode, tabUrl) {
	const rect = getSelectionCoordinates();

	// 创建悬浮框元素
	const floatingBox = document.createElement('div');
	floatingBox.style.position = 'absolute';
	floatingBox.style.top = `${rect.top + window.scrollY}px`;
	floatingBox.style.left = `${rect.left + window.scrollX}px`;
	floatingBox.style.width = '300px';
	floatingBox.style.padding = '10px';
	floatingBox.style.backgroundColor = 'white';
	floatingBox.style.border = '1px solid #ccc';
	floatingBox.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
	floatingBox.style.zIndex = '10000';
	floatingBox.style.borderRadius = '10px';
	floatingBox.style.color = 'black';  // 设置字体颜色为黑色

	console.log('mode:', mode);

	if (mode == 'Privacy & Utility') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
				<label for="quadrantController" style="margin-top: 10px;">选择匿名性和可用性指标:</label>
				<div style="position: relative; width: 240px; height: 260px; margin-top: 10px;">
					<canvas id="quadrantController" width="200" height="200" style="background-color: #f0f0f0; position: absolute; left: 30px; top: 20px"></canvas>
					<div style="position: absolute; left: 50%; transform: translateX(-50%);">Privacy</div>
					<div style="position: absolute; top: 50%; transform: translateY(-50%) rotate(-90deg);">Utility</div>
					<div id="coordinates" style="position: absolute; top: 90%; left: 50%; transform: translateX(-50%); color: black; text-align: center; width: 100%;"></div>
				</div>
				<button id="confirmButton" style="margin-top: 10px; width: 100%;">Confirm</button>
				<div id="statusBox" style="margin-top: 10px;"></div>
				<textarea id="resultBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px; display: none"></textarea>
				<button id="copyButton" style="margin-top: 10px; width: 100%; display: none">Copy</button>
				<div id="copyMessage" style="margin-top: 10px; display: none; color: green; left: 40%">已复制到剪贴板</div>
			</div>
		`;

		document.body.appendChild(floatingBox);

		const canvas = document.getElementById('quadrantController');
		const ctx = canvas.getContext('2d');

		const radius = canvas.width;
		const centerX = 0;
		const centerY = canvas.height;

		// 绘制1/4圆
		ctx.beginPath();
		ctx.moveTo(centerX, centerY);
		ctx.arc(centerX, centerY, radius, 1.5 * Math.PI, 2 * Math.PI);
		ctx.lineTo(centerX, centerY);
		ctx.closePath();
		ctx.fillStyle = '#ddd';
		ctx.fill();

		let quadrantCoordinates = { x: 50, y: 50 };

		canvas.addEventListener('click', function(event) {
			const rect = canvas.getBoundingClientRect();
			const x = event.clientX - rect.left;
			const y = event.clientY - rect.top;
			const dx = x - centerX;
			const dy = y - centerY;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance <= radius && x >= centerX && y <= centerY) {
				quadrantCoordinates.x = ((x - centerX) / radius) * 100;
				quadrantCoordinates.y = (1 - (y / radius)) * 100;
				drawPoint(x, y);
			}
		});

		function drawPoint(x, y) {
			ctx.clearRect(0, 0, canvas.width, canvas.height);

			// 绘制1/4圆
			ctx.beginPath();
			ctx.moveTo(centerX, centerY);
			ctx.arc(centerX, centerY, radius, 1.5 * Math.PI, 2 * Math.PI);
			ctx.lineTo(centerX, centerY);
			ctx.closePath();
			ctx.fillStyle = '#ddd';
			ctx.fill();

			// 绘制点
			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.fillStyle = '#000';
			ctx.fill();

			// 显示选择的坐标和区间
			const coordinatesDiv = document.getElementById('coordinates');
			coordinatesDiv.textContent = `Privacy: ${quadrantCoordinates.x.toFixed(2)}%, Utility: ${quadrantCoordinates.y.toFixed(2)}%`;
		}

		// 关闭按钮功能
		floatingBox.querySelector('#closeButton').addEventListener('click', () => {
			floatingBox.remove();
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;
			const progress1 = quadrantCoordinates.x;
			const progress2 = quadrantCoordinates.y;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				const processed_data = await anonymizeText(progress1, progress2, text);

				statusBox.textContent = '处理成功';
				const resultBox = document.querySelector('#resultBox');
				resultBox.value = processed_data;
				resultBox.style.display = 'block';
				const copyButton = document.querySelector('#copyButton');
				copyButton.style.display = 'block';
			} catch (error) {
				console.error(error);
				statusBox.textContent = '处理失败';
			}
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			if (navigator.clipboard) {
				navigator.clipboard.writeText(resultBox.value)
				.then(() => {
					console.log('文本已复制到剪贴板');
					const copyMessage = document.querySelector('#copyMessage');
					copyMessage.style.display = 'block';
					setTimeout(() => {
						copyMessage.style.display = 'none';
					}, 2000); // 2秒后隐藏提示消息
				})
				.catch(err => {
					console.error('复制文本失败:', err);
				});
			} else {
				console.log('浏览器不支持剪贴板API');
			}
		});
	} else if (mode == 'Privacy Only') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
				<label for="progress1">Privacy:</label>
        		<input type="range" id="progress1" value="50" max="100" style="width: 100%;">
				<button id="confirmButton" style="margin-top: 10px; width: 100%;">Confirm</button>
				<div id="statusBox" style="margin-top: 10px;"></div>
				<textarea id="resultBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px; display: none"></textarea>
				<button id="copyButton" style="margin-top: 10px; width: 100%; display: none">Copy</button>
				<div id="copyMessage" style="margin-top: 10px; display: none; color: green; left: 40%">已复制到剪贴板</div>
			</div>
		`;

		document.body.appendChild(floatingBox);

		// 关闭按钮功能
		floatingBox.querySelector('#closeButton').addEventListener('click', () => {
			floatingBox.remove();
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;
			const progress1 = document.querySelector('#progress1').value;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				const processed_data = await anonymizeText(progress1, 100, text);

				statusBox.textContent = '处理成功';
				const resultBox = document.querySelector('#resultBox');
				resultBox.value = processed_data;
				resultBox.style.display = 'block';
				const copyButton = document.querySelector('#copyButton');
				copyButton.style.display = 'block';
			} catch (error) {
				console.error(error);
				statusBox.textContent = '处理失败';
			}
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			if (navigator.clipboard) {
				navigator.clipboard.writeText(resultBox.value)
				.then(() => {
					console.log('文本已复制到剪贴板');
					const copyMessage = document.querySelector('#copyMessage');
					copyMessage.style.display = 'block';
					setTimeout(() => {
						copyMessage.style.display = 'none';
					}, 2000); // 2秒后隐藏提示消息
				})
				.catch(err => {
					console.error('复制文本失败:', err);
				});
			} else {
				console.log('浏览器不支持剪贴板API');
			}
		});
	} else if (mode == 'Utility Only') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
				<label for="progress2">Utility:</label>
        		<input type="range" id="progress2" value="50" max="100" style="width: 100%;">
				<button id="confirmButton" style="margin-top: 10px; width: 100%;">Confirm</button>
				<div id="statusBox" style="margin-top: 10px;"></div>
				<textarea id="resultBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px; display: none"></textarea>
				<button id="copyButton" style="margin-top: 10px; width: 100%; display: none">Copy</button>
				<div id="copyMessage" style="margin-top: 10px; display: none; color: green; left: 40%">已复制到剪贴板</div>
			</div>
		`;

		document.body.appendChild(floatingBox);

		// 关闭按钮功能
		floatingBox.querySelector('#closeButton').addEventListener('click', () => {
			floatingBox.remove();
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;
			const progress2 = document.querySelector('#progress2').value;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				const processed_data = await anonymizeText(0, progress2, text);

				statusBox.textContent = '处理成功';
				const resultBox = document.querySelector('#resultBox');
				resultBox.value = processed_data;
				resultBox.style.display = 'block';
				const copyButton = document.querySelector('#copyButton');
				copyButton.style.display = 'block';
			} catch (error) {
				console.error(error);
				statusBox.textContent = '处理失败';
			}
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			if (navigator.clipboard) {
				navigator.clipboard.writeText(resultBox.value)
				.then(() => {
					console.log('文本已复制到剪贴板');
					const copyMessage = document.querySelector('#copyMessage');
					copyMessage.style.display = 'block';
					setTimeout(() => {
						copyMessage.style.display = 'none';
					}, 2000); // 2秒后隐藏提示消息
				})
				.catch(err => {
					console.error('复制文本失败:', err);
				});
			} else {
				console.log('浏览器不支持剪贴板API');
			}
		});
	} else if (mode == 'None') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
				<textarea id="resultBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px;"></textarea>
				<button id="copyButton" style="margin-top: 10px; width: 100%;">Copy</button>
				<div id="copyMessage" style="margin-top: 10px; display: none; color: green; left: 40%">已复制到剪贴板</div>
			</div>
		`;

		document.body.appendChild(floatingBox);

		resultBox.value = selectedText;

		// 关闭按钮功能
		floatingBox.querySelector('#closeButton').addEventListener('click', () => {
			floatingBox.remove();
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			if (navigator.clipboard) {
				navigator.clipboard.writeText(resultBox.value)
				.then(() => {
					console.log('文本已复制到剪贴板');
					const copyMessage = document.querySelector('#copyMessage');
					copyMessage.style.display = 'block';
					setTimeout(() => {
						copyMessage.style.display = 'none';
					}, 2000); // 2秒后隐藏提示消息
				})
				.catch(err => {
					console.error('复制文本失败:', err);
				});
			} else {
				console.log('浏览器不支持剪贴板API');
			}
		});
	} else if (mode == 'DP Baseline') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
				<textarea id="contentBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px;"></textarea>
				<button id="confirmButton" style="margin-top: 10px; width: 100%;">Confirm</button>
				<div id="statusBox" style="margin-top: 10px;"></div>
				<textarea id="resultBox" style="margin-top: 10px; max-height: 180px; overflow-y: auto; white-space: pre-wrap; width: 100%; height: 150px; display: none"></textarea>
				<button id="copyButton" style="margin-top: 10px; width: 100%; display: none">Copy</button>
				<div id="copyMessage" style="margin-top: 10px; display: none; color: green; left: 40%">已复制到剪贴板</div>
			</div>
		`;

		document.body.appendChild(floatingBox);

		contentBox.value = selectedText;

		// 关闭按钮功能
		floatingBox.querySelector('#closeButton').addEventListener('click', () => {
			floatingBox.remove();
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			const origin = tabUrl.origin;

			chrome.runtime.sendMessage({
				type: 'fetchData',
				data: selectedText,
				origin: origin
			}, (response) => {
				if (response.success) {
					console.log('Data fetched successfully:', response.data);
					console.log('Anonymized text:', response.data['anonymized_text']);
					const processed_data = response.data['anonymized_text'];
					statusBox.textContent = '处理成功';
					const resultBox = document.querySelector('#resultBox');
					resultBox.value = processed_data;
					resultBox.style.display = 'block';
					const copyButton = document.querySelector('#copyButton');
				copyButton.style.display = 'block';
				} else {
					console.error('Error fetching data:', response.error);
					statusBox.textContent = '处理失败';
				}
			});
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			if (navigator.clipboard) {
				navigator.clipboard.writeText(resultBox.value)
				.then(() => {
					console.log('文本已复制到剪贴板');
					const copyMessage = document.querySelector('#copyMessage');
					copyMessage.style.display = 'block';
					setTimeout(() => {
						copyMessage.style.display = 'none';
					}, 2000); // 2秒后隐藏提示消息
				})
				.catch(err => {
					console.error('复制文本失败:', err);
				});
			} else {
				console.log('浏览器不支持剪贴板API');
			}
		});
	} else {
		console.log('Mode error!');
	}
}
		
// 从背景脚本接收消息并显示悬浮框
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'showFloatingBox') {
		console.log('script mode:', request.mode);
		createFloatingBox(request.selectedText, request.mode, request.tabUrl);
		sendResponse({status: 'success'});
	}
});

  	// function anonymizeText(progress1, progress2, text) {console.log(progress1, progress2, text);}
	async function anonymizeText(progress1, progress2, inputText) {
		const resourceName = "shuningz";
		const apiKey = "02427719893b42868f349a4668288963";
		const deploymentId = "gpt-4o";

		const information_classes = `
Name: the name of some person.
Birthday: the birthday of some person.
Age: number of years lived.
Gender: male or female or other.
Ethnicity / Race: ethnic background. 
Nationality: country of citizenship.
Place of origin: hometown or birthplace.
Marital status: single, married, etc.
Family relationships: relatives and their connections.
Address: residential location.
Phone number: contact telephone number.
Email address: electronic mail address.
Hobbies and interests: personal interests and activities.
Identification card: national ID number.
Passport: passport number.
Driver's license: license to drive.
Work permit: employment authorization.
User account: account username.
User ID: unique user identifier.
Instant messaging account: IM service handle.
Social media account: social network handle.
Nickname: informal name or alias.
IP address: internet protocol address.
Weight: body mass.
Height: stature.
Blood type: blood group classification.
Medical conditions: health status and issues.
Medical instructions: doctor's orders.
Test reports: medical test results.
Physical examination reports: health checkup results.
Medical history: past health issues.
Educational background: level of education completes.
Degree: academic degree.
Educational experience: schooling history.
Transcript: academic record.
Occupation: job title.
Job title: specific position at work.
Employer: place of employment.
Work location: place of work.
Work experience: employment history.
Salary: earnings from employment.
Resume: professional CV.
Bank card number: debit/credit card number.
Payment account: online payment account.
Account balance: available funds.
Transaction order: purchase or sale record.
Transaction amount: value of transactions.
Payment records: history of payments.
Income status: financial earnings.
Property information: real estate details.
Deposit information: savings details.
Vehicle information: car ownership details.
Tax amount: taxes paid.
Virtual property: digital assets.
Loan information: borrowing details.
Repayment information: loan repayment status.
Debt information: outstanding debts.
Credit records: credit history.
Credit information: credit score and details.
Account login password: password for account access.
Bank card password: PIN for bank card.
Payment password: password for transactions.
Account query password: password for account 
Transaction password: password for confirming transactions.
Bank card verification code: CVV for security code.
USB key: security token device.
Dynamic password: one-time password.
SMS verification code: code sent via SMS for verification.
Personal digital certificate: digital ID for security.
Random token: security token for access.
Communication records: logs of communications.
SMS: text messages.
Email: electronic mail messages.
Instant messaging: online chat records.
Contacts: address book entries.
Friends list: list of social connections.
Group list: list of group memberships.
Email address list: collection of email contacts.
Family relationships: relatives and their connections.
Work Relationships: colleague connections.
Social Relationships: friends and acquaintances.
Web Browsing History: record of internet sites visited.
Software Usage Records: application usage data.
Cookies: web browsing data files.
Published Social Information: posted social media content.
Search History: record of internet searches.
Download History: record of downloaded files.
Region Code: geographical area code.
City Code: code for city identification.
Longitude and Latitude: geographic coordinates.
Accommodation Information: housing details.
Community Code: neighborhood identifier.
Step Count: number of steps taken.
Step Frequency: steps per minute.
Exercise Duration: length of workout.
Exercise Distance: distance covered in exercise.
Exercise Type: type of physical activity.
Heart Rate during Exercise: beats per minute during exercise.
Sexual Orientation: sexual preference.
Marriage History: past marital status.
Religious Belief: faith or religion.
Undisclosed Criminal Records: hidden criminal history.
Common Languages: languages spoken.
Past or Current Educational Majors: field of study.
`;

    const classes = information_classes.split('\n').map(line => line.split(': ')[0]);
    for (let i = 0; i < classes.length; i++) {
        classes[i] = classes[i].toLowerCase()
    }

    const class_info = [[4.0, 0.43], [3.69, 0.43], [3.73, 2.29], [3.27, 2.57], [2.54, 1.14], [2.81, 2.86], [3.62, 0.43], [3.62, 1.71], [4.54, 1.14], [5.92, 0.0], [5.54, 0.43], [4.54, 0.0], [3.69, 2.14], [6.23, 0.0], [6.0, 0.0], [5.5, 0.0], [5.65, 0.0], [4.54, 0.29], [4.46, 0.14], [5.15, 0.29], [5.19, 0.14], [3.08, 0.86], [5.19, 1.14], [3.46, 0.43], [3.46, 0.29], [3.54, 0.14], [5.15, 1.14], [5.23, 1.14], [5.38, 1.57], [5.38, 1.14], [5.15, 1.0], [4.15, 2.86], [4.15, 2.43], [4.65, 3.43], [4.04, 0.71], [4.58, 4.29], [4.42, 3.29], [5.35, 1.14], [5.35, 1.0], [4.96, 2.71], [4.85, 0.43], [5.04, 3.0], [6.04, 0.14], [6.04, 0.14], [5.96, 0.0], [5.62, 0.57], [5.12, 0.43], [5.38, 0.43], [5.69, 0.71], [6.04, 0.57], [6.12, 0.43], [5.38, 0.43], [5.04, 0.43], [4.77, 0.57], [5.77, 0.29], [5.65, 0.29], [5.85, 0.29], [5.77, 0.29], [5.85, 0.29], [6.15, 0.57], [6.38, 0.0], [6.35, 0.0], [6.35, 0.0], [6.35, 0.0], [6.0, 0.0], [5.85, 0.0], [5.62, 0.0], [5.42, 0.43], [5.15, 0.57], [4.88, 0.0], [5.5, 0.71], [5.46, 0.71], [5.35, 1.0], [5.27, 0.29], [5.58, 0.29], [5.31, 0.29], [4.85, 0.29], [4.85, 0.29], [5.73, 0.71], [5.27, 0.57], [5.31, 0.71], [5.77, 0.86], [5.62, 1.14], [4.88, 1.0], [4.54, 1.71], [5.35, 1.57], [5.31, 1.57], [3.96, 0.57], [3.88, 0.43], [4.42, 0.29], [5.58, 0.14], [4.96, 0.0], [3.38, 0.14], [3.0, 0.14], [3.0, 0.57], [2.92, 0.71], [2.92, 0.86], [3.12, 0.29], [3.92, 0.86], [4.08, 1.0], [3.42, 1.86], [5.15, 1.29], [2.58, 4.29], [3.15, 3.43]];

    const prompt_anonymization = `Please act as an expert adn analyze the private information in the below paragraph. I'll give you an example first. The information class MUST be selected from the given list.

    [Information Classes]
    ` + information_classes;

    const example = `[Example]
[Example input]
John Doe, born on January 1, 1980, is a 44-year-old Caucasian male from New York, USA. He holds American nationality and currently resides at 1234 Elm Street, Springfield, IL, 62704. John is married to Jane Doe, and they have two children, Alice and Bob Doe. He enjoys reading, hiking, and photography in his free time.

John's contact information includes a phone number, (123) 456-7890, and an email address, john.doe@example.com. His identification details include a national ID (123456789), a passport (A12345678), a driver's license (D1234567), and a work permit (WP123456). For online activities, he uses the user account johndoe_80 with user ID 001234567, and his instant messaging and social media accounts are johndoeIM and @johndoe, respectively. He is often referred to by his nickname, Johnny, and his IP address is 192.168.1.1.

Physically, John is 6 feet tall, weighs 180 pounds, and has an O+ blood type. He has a medical history of asthma and currently manages hypertension with daily medication. His latest medical reports, including blood test and physical examination, indicate good health.

John holds a Bachelor's degree in Computer Science from the University of Illinois, where he studied from 1998 to 2002. Professionally, he is a Senior Developer at Tech Solutions Inc., located at 5678 Oak Street, Springfield, IL, 62704, and has 20 years of experience in software development, earning an annual salary of $120,000. His resume and academic transcript are available upon request.

Financially, John manages a bank card (1234 5678 9012 3456) and an online payment account (johndoe_pay@example.com) with a current balance of $5,000. He has conducted transactions such as a $200 order and a $50 payment to Amazon. He owns a house at 1234 Elm Street, a 2018 Toyota Camry, and has a savings account with $10,000. His annual tax payment is $12,000, and he holds virtual assets, including 5 Bitcoin. John has a mortgage of $200,000, with a monthly repayment of $1,500, and a credit card debt of $2,000, but maintains an excellent credit score of 750.

For security, John uses various passwords, a USB key, dynamic passwords, SMS verification codes, a personal digital certificate, and a random token for account access and transactions. His communication records, including SMS, email, instant messaging, and contacts, are archived. He has 150 friends on social media, is a member of 10 online groups, and maintains an email address list for personal and professional use.

John's browsing history, software usage records, cookies, published social information, search history, and download history are recorded. His geographic information includes a region code (123), city code (456), and coordinates (39.7817° N, 89.6501° W). He has accommodation details for travel, a community code (789), and tracks his physical activity, averaging 10,000 steps daily at a frequency of 100 steps per minute, with 30 minutes of exercise covering 3 miles. His heart rate during exercise is typically 140 BPM.

John identifies as heterosexual, has been married since 2005, and practices Christianity. He has no undisclosed criminal records and is fluent in English and Spanish. His academic focus has always been in Computer Science.

[Example output]
(John Doe)[Name], born on (January 1, 1980)[Date of Birth], is a (44-year-old)[Age] (Caucasian)[Ethnicity] (male)[Gender] from (New York, USA)[Place of Origin]. He holds (American nationality)[Nationality] and currently resides at (1234 Elm Street, Springfield, IL, 62704)[Address]. John is (married)[Marital Status] to Jane Doe, and they have two children, (Alice and Bob Doe)[Family Relationships]. He enjoys (reading, hiking, and photography)[Hobbies and Interests] in his free time.

John's contact information includes a phone number, ((123) 456-7890)[Phone Number], and an email address, (john.doe@example.com)[Email Address]. His identification details include a national ID ((123456789))[Identification Card], a passport ((A12345678))[Passport], a driver's license ((D1234567))[Driver's License], and a work permit ((WP123456))[Work Permit]. For online activities, he uses the user account (johndoe_80)[User Account] with user ID (001234567)[User ID], and his instant messaging and social media accounts are (johndoeIM)[Instant Messaging Account] and (@johndoe)[Social Media Account], respectively. He is often referred to by his nickname, (Johnny)[Nickname], and his IP address is (192.168.1.1)[IP Address].

Physically, John is (6 feet tall)[Height], weighs (180 pounds)[Weight], and has an (O+ blood type)[Blood Type]. He has a medical history of (asthma)[Medical History] and currently manages (hypertension)[Medical Conditions] with daily medication (Medical Instructions). His latest medical reports, including (blood test)[Test Reports] and (physical examination)[Physical Examination Reports], indicate good health.

John holds a (Bachelor's degree)[Degree] in (Computer Science)[Past or Current Educational Majors] from (University of Illinois)[Educational Experience], where he studied from 1998 to 2002. Professionally, he is a (Senior Developer)[Job Title] at (Tech Solutions Inc.)[Employer], located at (5678 Oak Street, Springfield, IL, 62704)[Work Location], and has (20 years)[Work Experience] of experience in software development, earning an annual salary of ($120,000)[Salary]. His (resume)[Resume] and academic (transcript)[Transcript] are available upon request.

Financially, John manages a bank card ((1234 5678 9012 3456))[Bank Card Number] and an online payment account ((johndoe_pay@example.com))[Payment Account] with a current balance of ($5,000)[Account Balance]. He has conducted transactions such as a ($200 order)[Transaction Order] and a ($50 payment to Amazon)[Payment Records]. He owns a house at (1234 Elm Street)[Property Information], a (2018 Toyota Camry)[Vehicle Information], and has a savings account with ($10,000)[Deposit Information]. His annual tax payment is ($12,000)[Tax Amount], and he holds virtual assets, including (5 Bitcoin)[Virtual Property]. John has a mortgage of ($200,000)[Loan Information], with a monthly repayment of ($1,500)[Repayment Information], and a credit card debt of ($2,000)[Debt Information], but maintains an excellent credit score of (750)[Credit Information].

For security, John uses various passwords ([Account Login Password], [Bank Card Password], [Payment Password], [Account Query Password], [Transaction Password]), a (USB key)[USB Key], dynamic passwords ([Dynamic Password]), SMS verification codes ([SMS Verification Code]), a (personal digital certificate)[Personal Digital Certificate], and a (random token)[Random Token] for account access and transactions. His (communication records)[Communication Records], including (SMS)[SMS], (email)[Email], (instant messaging)[Instant Messaging], and (contacts)[Contacts], are archived. He has (150 friends)[Friends List] on social media, is a member of (10 online groups)[Group List], and maintains an (email address list)[Email Address List] for personal and professional use.

John's (browsing history)[Web Browsing History], (software usage records)[Software Usage Records], (cookies)[Cookies], (published social information)[Published Social Information], (search history)[Search History], and (download history)[Download History] are recorded. His geographic information includes a (region code (123))[Region Code], (city code (456))[City Code], and (coordinates (39.7817° N, 89.6501° W))[Longitude and Latitude]. He has (accommodation details)[Accommodation Information] for travel, a (community code (789))[Community Code], and tracks his physical activity, averaging (10,000 steps)[Step Count] daily at a frequency of (100 steps per minute)[Step Frequency], with (30 minutes of exercise covering 3 miles)[Exercise Distance]. His heart rate during exercise is typically (140 BPM)[Heart Rate during Exercise].

John identifies as (heterosexual)[Sexual Orientation], has been (married since 2005)[Marriage History], and practices (Christianity)[Religious Belief]. He has no (undisclosed criminal records)[Undisclosed Criminal Records] and is fluent in (English and Spanish)[Common Languages]. His academic focus has always been in (Computer Science)[Past or Current Educational Majors].

[Real Input]
`;

    const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

    const client = new OpenAIClient(
        `https://${resourceName}.openai.azure.com/`,
        new AzureKeyCredential(apiKey)
    );

    // const {choices} = await client.getChatCompletions(deploymentId, [`${prompt_anonymization}${example}${text}`]);
    const messages = [{ role: "user", content: `${prompt_anonymization}${example}${inputText}` }];
    try {
        const result = await client.getChatCompletions(deploymentId, messages);
        if (!result.choices || result.choices.length === 0) {
            throw new Error('No completion returned');
        }
        console.log(`Chatbot: ${result.choices[0].message?.content}`);
        const textResult = result.choices[0].message?.content;
        // Extract sensitive information from the response
        const pattern = /\((.*?)\)\[(.*?)\]/g;
        let match;
        const results = [];
        while ((match = pattern.exec(textResult)) !== null) {
            const value = match[1];
            const type = match[2];

            // 验证匹配项是否符合预期格式
            if (value && type) {
                results.push({
                    value: value,
                    type: type
                });
            } else {
                console.warn(`Skipping invalid match: ${match[0]}`);
            }
        }

        const pt = pseudonymizeText(inputText, results, classes, class_info, progress1, progress2);
        console.log('Pseudonymized text:', pt);
        console.log(inputText);
        console.log(results);
        return pt;
    } catch (error) {
        console.error(error);
        throw error;
    }
  }

  function pseudonymizeText(text, sensitiveInfo, classes, class_info, progress1, progress2) {

	sensitiveInfo.forEach(info => {
        const type = info.type.toLowerCase();
		if (classes.includes(type)) {
            const index = classes.indexOf(type);
            const [priv, util] = class_info[index];
            console.log(priv, util);
            if (priv * 100 > progress1 * 7 && util * 100 < progress2 * 7) {
                const replacement = `[${info.type}]`;
                text = text.replace(new RegExp(info.value, 'g'), replacement);
            }
		}
	});
	return text;
  }
  