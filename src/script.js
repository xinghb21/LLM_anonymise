// 获取选中的文字的范围和位置信息
function getSelectionCoordinates() {
	const selection = window.getSelection();
	const range = selection.getRangeAt(0).cloneRange();
	const rect = range.getBoundingClientRect();
	return rect;
}

// 创建悬浮框
function createFloatingBox(selectedText, mode, tabUrl) {

	const existingBox = document.querySelector('.floatingBox');
	if (existingBox) {
		existingBox.remove();
	}

	const rect = getSelectionCoordinates();

	// 创建悬浮框元素
	const floatingBox = document.createElement('div');
	floatingBox.classList.add('floatingBox');
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

	let processed_data = '';
	let last_data = '';

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

		canvas.addEventListener('click', function (event) {
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
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
				processed_data = await anonymizeText(progress1, progress2, text);

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
			last_data = resultBox.value;
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
	} else if (mode == 'Automatic') {
		floatingBox.innerHTML = `
			<div>
				<button id="closeButton" style="position: absolute; top: 5px; right: 5px; background-color: transparent; border: none; color: #333; font-size: 16px;">&times;</button>
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				processed_data = await anonymizeText(0, 100, text);

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
			last_data = resultBox.value;
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;
			const progress1 = document.querySelector('#progress1').value;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				processed_data = await anonymizeText(progress1, 100, text);

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
			last_data = resultBox.value;
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
		});

		// 确认按钮功能
		floatingBox.querySelector('#confirmButton').addEventListener('click', async () => {
			const text = selectedText;
			const progress2 = document.querySelector('#progress2').value;

			// 显示加密中状态
			const statusBox = document.querySelector('#statusBox');
			statusBox.textContent = '处理中...';

			try {
				processed_data = await anonymizeText(0, progress2, text);

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
			last_data = resultBox.value;
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
		});

		// 复制按钮功能
		floatingBox.querySelector('#copyButton').addEventListener('click', () => {
			const resultBox = document.querySelector('#resultBox');
			last_data = resultBox.value;
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
			chrome.runtime.sendMessage({
				type: 'AddLog',
				raw: selectedText,
				processed: processed_data,
				last: last_data,
				origin: tabUrl.origin
			});
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
					processed_data = response.data['anonymized_text'];

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
			last_data = resultBox.value;
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
		sendResponse({ status: 'success' });
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
“张三，1980年1月1日出生，是一名44岁的白人男性，来自美国纽约。他在伊利诺伊州立大学上学，持有美国国籍，目前居住在伊利诺伊州斯普林菲尔德市1234榆树街，邮编62704。张三已婚，妻子是白四，他们有两个孩子，分别是张思佳和张思茜。在空闲时间，他喜欢阅读、徒步旅行和摄影。

张三的电话号码是(123) 456-7890，电子邮件地址为john.doe@example.com。他美国的国民身份证号码是123456789，护照号码是A12345678，驾驶执照号码是D1234567，工作许可证号码是WP123456。他的微信用户名是zhangsan_80，QQ ID为001234567，并且他的抖音和小红书账号分别是sanzhangIM和@zhangsan。大家经常叫他San，他主机的IP地址是192.168.1.2。

张三身高6英尺，体重180磅，血型为O型。他有哮喘病史，目前通过每天服药来控制高血压。他最近去北京北医三院体检过，最近的体检报告和血液测试结果显示他健康状况良好。张三拥有伊利诺伊大学的计算机科学学士学位，1998年至2002年在该校学习。目前，他是Tech Solutions Inc.的高级开发人员，公司位于伊利诺伊州斯普林菲尔德市橡树街5678号，邮编62704。他在软件开发领域有20年的工作经验，年薪为12万美元。他在考虑跳槽，但因为所在的公司是鸿兴公司和天成软件开发公司，都不是很有名的公司，跳槽的面试并不顺利。

在财务方面，张三有自己的一张银行卡(1234 5678 9012 3456)和一个在线支付账户(zhangsan_pay@example.com)，目前账户余额为5,000美元。他这一周曾买过200美元的外卖并在亚马逊买过50美元的日杂用品。他拥有位于1234榆树街的房子，一辆2018款丰田凯美瑞，并有一个储蓄账户，余额为10,000美元。他每年的税款为12,000美元，拥有5个比特币等虚拟资产。约翰有20万美元的房贷，每月还款为1,500美元，信用卡债务为2,000美元，但信用评分保持在750分，属于优秀。

在安全方面，约翰使用多种密码、USB密钥、动态密码、短信验证码、个人数字证书和随机令牌进行账户访问和交易。他的通讯记录，包括短信、电子邮件、即时消息和联系人，都有存档。他在社交媒体上有150位朋友，加入了10个在线群组，并维护一个用于个人和职业用途的邮件列表。他的父亲和母亲都是大学老师，妻子也是从事教育工作的。这些对于他的职业生涯规划和发展有很大帮助。

由于APP的安全性太弱，张三的浏览历史、软件使用记录、Cookies、发布的社交信息、搜索历史和下载历史经常会被他所使用的APP记录。这些APP很容易泄漏他的地理信息，包括区域代码123、城市代码456和纬度坐标39.7817° N, 89.6501° W。此外，更危险的信息也时常会被推断。他的旅行住宿的详细信息已经不再是秘密、社区代码是789。这些软件还会记录他的身体活动：他平均每天行走10,000步，频率为每分钟100步，大约30分钟的锻炼会覆盖3英里。他运动时的心率通常为每分钟140次。

约翰自认是异性恋，自2005年起结婚，信仰基督教。他没有未披露的犯罪记录，能流利地使用英语和西班牙语。他的学术兴趣一直集中在计算机科学领域。”

[Example output]
(张三)[Name]<李四>，(1980年1月1日)[Birthday]<1999年1月3日>出生，是一名(44岁)[Age]<25岁>的(白人)[Ethnicity]<汉族>男性，来自(美国纽约)[Place of Origin]<中国北京>。他持有(美国国籍)[Nationality]<中国国籍>，目前居住在(伊利诺伊州斯普林菲尔德市1234榆树街，邮编62704)[Address]<北京市海淀区中关村大街100号>。张三已婚，妻子是(白四)[Spouse]<王五>，他们有两个孩子，分别是(张思佳和张思茜)[Children]<李华和李梅>。他在空闲时间喜欢(阅读、徒步旅行和摄影)[Hobbies and Interests]<打篮球、听音乐和旅行>。

张三的电话号码是((123) 456-7890)[Phone Number]<13800138000>，电子邮件地址是(john.doe@example.com)[Email Address]lisi@example.com。他的身份证明文件包括(美国国民身份证号码123456789)[National ID]<中国身份证号码110101199901013456>，(护照号码A12345678)[Passport]<E12345678>，(驾驶执照号码D1234567)[Driver's License]<B1234567>，和(工作许可证号码WP123456)[Work Permit]<WP789012>。他的(微信用户名是zhangsan_80)[WeChat ID]<lisi_99>，(QQ ID为001234567)[QQ ID]<998877665>，抖音和小红书账号分别是(sanzhangIM)[Douyin ID]<lisiIM>和(@zhangsan)[Xiaohongshu ID]<@lisi99>。大家经常叫他(San)[Nickname]<小李>，他的IP地址是(192.168.1.2)[IP Address]<192.168.1.3>。

张三身高(6英尺)[Height]<180厘米>，体重(180磅)[Weight]<75公斤>，血型为(O型)[Blood Type]<A型>。他有(哮喘病史)[Medical History]，目前通过每天服药来控制(高血压)[Medical Condition]。他最近在北京北医三院体检过，体检报告和血液测试结果显示他(健康状况良好)[Health Status]<身体状况良好>。

张三拥有(伊利诺伊大学的计算机科学学士学位)[Degree]<北京大学的计算机科学学士学位>，1998年至2002年在该校学习。目前，他是(Tech Solutions Inc.的高级开发人员)[Job Title]<京东科技的高级开发人员>，公司位于(伊利诺伊州斯普林菲尔德市橡树街5678号，邮编62704)[Company Address]<北京市朝阳区望京街1号>。他在(软件开发领域有20年的工作经验)[Work Experience]<有5年的软件开发经验>，年薪为(12万美元)[Salary]<50万元人民币>。他在考虑跳槽，但由于所在的公司是(鸿兴公司和天成软件开发公司)[Companies]<一些不知名的小公司>，都不是很有名的公司，(跳槽的面试并不顺利)[Job Seeking Status]<跳槽并不顺利>。

在财务方面，张三有一张(银行卡1234 5678 9012 3456)[Bank Card]<中国银行信用卡6217 1234 5678 9012>和一个(在线支付账户zhangsan_pay@example.com)[Online Payment Account]lisi_pay@example.com，目前账户余额为(5,000美元)[Account Balance]<30,000元人民币>。他这一周曾买过(200美元的外卖)[Recent Transaction]<600元的外卖>并在亚马逊买过(50美元的日杂用品)[Amazon Purchase]<300元的日用品>。他拥有(位于1234榆树街的房子)[House]<位于北京市海淀区的房子>，一辆(2018款丰田凯美瑞)[Car]<2020款本田雅阁>，并有一个(储蓄账户，余额为10,000美元)[Savings Account]<余额为50,000元人民币>。他每年的(税款为12,000美元)[Tax Payment]<税款为60,000元人民币>，拥有(5个比特币等虚拟资产)[Virtual Assets]<10个比特币>。张三有(20万美元的房贷)[Mortgage]<100万元人民币的房贷>，每月还款为(1,500美元)[Monthly Repayment]<8,000元人民币>，信用卡债务为(2,000美元)[Credit Card Debt]<10,000元人民币>，但信用评分保持在(750分)[Credit Score]<800分>，属于优秀。

在安全方面，张三使用多种密码，包括([账户登录密码][Account Login Password]<loginpassword123>，[银行卡密码][Bank Card Password]<cardpassword456>，[支付密码][Payment Password]<paypassword789>，[账户查询密码][Account Query Password]<querypassword012>，[交易密码][Transaction Password]<transactionpassword345>)，一个(USB密钥)[USB Key]<USB Key>，动态密码([Dynamic Password]<dynamicpassword>)，短信验证码([SMS Verification Code]<smscode>)，个人数字证书([Personal Digital Certificate]<personalcertificate>)，和随机令牌([Random Token]<randomtoken>)进行账户访问和交易。他的(通讯记录)[Communication Records]<通讯记录>，包括(短信)[SMS]<短信>，(电子邮件)[Email]<电子邮件>，(即时消息)[Instant Messaging]<即时消息>，和(联系人)[Contacts]<联系人>，都有存档。他在社交媒体上有(150位朋友)[Friends]<200位朋友>，加入了(10个在线群组)[Groups]<20个在线群组>，并维护一个用于个人和职业用途的(邮件列表)[Email List]<邮件列表>。他的(父亲和母亲都是大学老师)[Parents' Occupation]<父亲是工程师，母亲是医生>，妻子也是(从事教育工作)[Spouse's Occupation]<金融分析师>。这些对于他的(职业生涯规划和发展)[Career Development]<职业发展>有很大帮助。

由于APP的安全性太弱，张三的(浏览历史)[Browsing History]<浏览历史>，(软件使用记录)[Software Usage Records]<软件使用记录>，(Cookies)[Cookies]<Cookies>，(发布的社交信息)[Published Social Information]<发布的社交信息>，(搜索历史)[Search History]<搜索历史>，和(下载历史)[Download History]<下载历史>经常会被他所使用的APP记录。这些APP很容易泄漏他的(地理信息)[Geographic Information]<地理信息>，包括(区域代码123)[Region Code]<区号110>，(城市代码456)[City Code]<城市代码010>和(纬度坐标39.7817° N, 89.6501° W)[Coordinates]<纬度坐标39.9042° N, 116.4074° E>。此外，更危险的信息也时常会被推断。他的(旅行住宿的详细信息)[Travel Accommodation Information]<旅行住宿信息>已经不再是秘密，社区代码是(789)[Community Code]<社区代码123>。这些软件还会记录他的(身体活动)[Physical Activity]<身体活动>：他平均每天行走(10,000步)[Daily Steps]<8,000步>，频率为(每分钟100步)[Step Frequency]<每分钟80步>，大约(30分钟的锻炼会覆盖3英里)[Exercise Duration]<30分钟的锻炼会覆盖4公里>。他运动时的心率通常为(每分钟140次)[Heart Rate during Exercise]<每分钟130次>。

张三自认是(异性恋)[Sexual Orientation]<异性恋>，自(2005年起结婚)[Marital Status]<2010年起结婚>，信仰(基督教)[Religion]<佛教>。他没有(未披露的犯罪记录)[Criminal Record]<未披露的犯罪记录>，能流利地使用(英语和西班牙语)[Languages]<英语和法语>。他的学术兴趣一直集中在(计算机科学领域)[Academic Focus]<金融领域>。

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
		const pattern = /\((.*?)\)\[(.*?)\]\<(.*?)\>/g;
		let match;
		const results = [];
		while ((match = pattern.exec(textResult)) !== null) {
			const value = match[1];
			const type = match[2];
			const replacement = match[3];

			// 验证匹配项是否符合预期格式
			if (value && type) {
				results.push({
					value: value,
					type: type,
					replacement: replacement
				});
			} else {
				console.warn(`Skipping invalid match: ${match[0]}`);
			}
		}

		const pt = pseudonymizeText(inputText, results, classes, class_info, progress1, progress2);
		console.log('Pseudonymized text:', pt);
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
				const replacement = info.replacement;
				text = text.replace(new RegExp(info.value, 'g'), replacement);
			}
		}
	});
	return text;
}