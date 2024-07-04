import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

chrome.runtime.onInstalled.addListener(() => {
console.log('Privacy Control with OpenAI extension installed.');

chrome.contextMenus.create({
    id: "anonymize-text",
    title: "Anonymize text",
    contexts: ["selection"]
});
});

function getTabId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      callback(tabs[0].id);
    });
}

// 在chrome.runtime.onMessage.addListener中接收并存储mode
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.mode) {
        console.log('Received mode:', request.mode);
        // 存储mode到chrome.storage
        chrome.storage.sync.set({ selectMode: request.mode }, function() {
            console.log('Mode is stored in chrome.storage:', request.mode);
        });
    }
    sendResponse({ status: 'Mode received' });
});

// 在chrome.contextMenus.onClicked中获取存储的mode并传递给脚本
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "anonymize-text") {
      let selectedText = info.selectionText || " ";
      console.log("Executing script with selected text:", selectedText);
      getTabId((tabId) => {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["dist/script.bundle.js"]
        }).then(() => {
            console.log("Injected script file");
            // 获取存储的mode
            chrome.storage.sync.get(['selectMode'], function(result) {
                console.log('mode:', result.selectMode);
                if (chrome.runtime.lastError) {
                    console.error('Error retrieving mode:', chrome.runtime.lastError);
                } else {
                    console.log("Injected script file");
                    // 传递mode给脚本
                    chrome.tabs.sendMessage(tab.id, { action: 'showFloatingBox', selectedText: selectedText, mode: (result.selectMode || "None") });
                }
            });
        }).catch((err) => {
            console.error("Failed to inject script:", err);
        });
      });
    }
});

async function anonymizeText(inputText) {
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
    `

    const classes = information_classes.split('\n').map(line => line.split(': ')[0]);

    const class_info = [[0.58, 0.03], [0.51, 0.03], [0.53, 0.14], [0.58, 0.17], [0.38, 0.07], [0.52, 0.19], [0.43, 0.01], [0.38, 0.03], [0.48, 0.07], [0.53, 0.0], [0.76, 0.03], [0.74, 0.0], [0.61, 0.14], [0.6, 0.0], [0.41, 0.0], [0.26, 0.0], [0.28, 0.0], [0.76, 0.02], [0.73, 0.01], [0.76, 0.02], [0.77, 0.01], [0.5, 0.05], [0.58, 0.05], [0.39, 0.02], [0.39, 0.02], [0.38, 0.01], [0.45, 0.08], [0.28, 0.08], [0.29, 0.11], [0.25, 0.08], [0.33, 0.07], [0.75, 0.19], [0.64, 0.14], [0.82, 0.21], [0.35, 0.04], [0.7, 0.17], [0.54, 0.11], [0.36, 0.04], [0.31, 0.0], [0.44, 0.1], [0.23, 0.0], [0.56, 0.12], [0.46, 0.0], [0.41, 0.0], [0.1, 0.0], [0.32, 0.0], [0.31, 0.0], [0.21, 0.0], [0.35, 0.0], [0.22, 0.04], [0.18, 0.03], [0.18, 0.03], [0.12, 0.0], [0.14, 0.0], [0.11, 0.0], [0.11, 0.0], [0.11, 0.0], [0.16, 0.0], [0.22, 0.0], [0.47, 0.04], [0.29, 0.0], [0.41, 0.0], [0.29, 0.0], [0.29, 0.0], [0.33, 0.0], [0.27, 0.0], [0.28, 0.0], [0.53, 0.03], [0.22, 0.0], [0.36, 0.0], [0.29, 0.0], [0.55, 0.0], [0.75, 0.02], [0.42, 0.0], [0.25, 0.0], [0.24, 0.0], [0.2, 0.0], [0.2, 0.0], [0.32, 0.0], [0.3, 0.0], [0.3, 0.0], [0.59, 0.06], [0.47, 0.06], [0.5, 0.07], [0.4, 0.09], [0.54, 0.11], [0.56, 0.11], [0.29, 0.01], [0.26, 0.0], [0.17, 0.0], [0.33, 0.0], [0.13, 0.0], [0.29, 0.01], [0.23, 0.0], [0.29, 0.02], [0.28, 0.01], [0.33, 0.04], [0.26, 0.0], [0.21, 0.0], [0.21, 0.0], [0.25, 0.03], [0.18, 0.0], [0.51, 0.22], [0.62, 0.22]];

    const prompt_anonymization = `Please act as an expert adn analyze the private information in the below paragraph. I'll give you an example first.

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

    const client = new OpenAIClient(
        `https://${resourceName}.openai.azure.com/`,
        new AzureKeyCredential(apiKey)
    );

    // const {choices} = await client.getChatCompletions(deploymentId, [`${prompt_anonymization}${example}${text}`]);
    const messages = [{ role: "user", content: `${prompt_anonymization}${example}${inputText}` }];
    const result = await client.getChatCompletions(deploymentId, messages);
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

    const pt = pseudonymizeText(inputText, results, classes, class_info);
    console.log('Pseudonymized text:', pt);
    console.log(inputText);
    console.log(results);
    return pt;
}

function pseudonymizeText(text, sensitiveInfo, classes, class_info) {

    sensitiveInfo.forEach(info => {
        if (classes.includes(info.type)) {
            const index = classes.indexOf(info.type);
            const [priv, util] = class_info[index];
            const replacement = `[${info.type}]`;
            text = text.replace(new RegExp(info.value, 'g'), replacement);
        }
    });
    return text;
}

function getSelectedText() {
    return window.getSelection().toString();
}
