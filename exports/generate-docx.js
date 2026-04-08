const { Document, Packer, Paragraph, TextRun, AlignmentType, LevelFormat, HeadingLevel, BorderStyle, PageBreak } = require('docx');
const fs = require('fs');

function makeWaiver(config) {
  const { title, location, sections, acks, footer } = config;

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 36, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 120, after: 200 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 26, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 300, after: 120 }, outlineLevel: 1 } },
      ]
    },
    numbering: {
      config: [
        { reference: "bullets",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
        { reference: "checks",
          levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2610", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      ]
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: buildContent(title, location, sections, acks, footer)
    }]
  });

  return doc;
}

function buildContent(title, location, sections, acks, footer) {
  const children = [];

  // Title
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: "Rental Agreement & Liability Waiver", size: 36, bold: true })]
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: "Mozy Outdoors", size: 28, bold: true, color: "216977" })]
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: location, size: 20, color: "7a7269", italics: true })]
  }));

  // Intro
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Please read each section carefully and complete all fields before your rental begins. This waiver must be signed by every adult renter in your party. After submission, you will continue to booking and payment.", size: 21 })]
  }));

  // Divider
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "d8d0c4", space: 1 } },
    spacing: { after: 200 },
    children: []
  }));

  // Sections
  for (const sec of sections) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({ text: sec.num + "  ", color: "CC5829", bold: true }),
        new TextRun({ text: sec.title, bold: true })
      ]
    }));

    for (const item of sec.content) {
      if (item.type === 'p') {
        children.push(new Paragraph({
          spacing: { after: 120 },
          children: formatRuns(item.text)
        }));
      } else if (item.type === 'bullets') {
        for (const b of item.items) {
          children.push(new Paragraph({
            numbering: { reference: "bullets", level: 0 },
            spacing: { after: 60 },
            children: formatRuns(b)
          }));
        }
      } else if (item.type === 'callout') {
        children.push(new Paragraph({
          indent: { left: 360 },
          border: { left: { style: BorderStyle.SINGLE, size: 12, color: "CC5829", space: 8 } },
          spacing: { before: 120, after: 120 },
          children: [new TextRun({ text: item.text, bold: true, size: 20 })]
        }));
      } else if (item.type === 'specs') {
        for (const spec of item.items) {
          children.push(new Paragraph({
            spacing: { after: 40 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: spec.label + ": ", bold: true, size: 20 }),
              new TextRun({ text: spec.value, size: 20 })
            ]
          }));
        }
      }
    }
  }

  // Acknowledgments
  children.push(new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [
      new TextRun({ text: "07  ", color: "CC5829", bold: true }),
      new TextRun({ text: "Acknowledgments", bold: true })
    ]
  }));
  children.push(new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text: "Please check each box to confirm your understanding:" })]
  }));
  for (const ack of acks) {
    children.push(new Paragraph({
      numbering: { reference: "checks", level: 0 },
      spacing: { after: 100 },
      children: formatRuns(ack)
    }));
  }

  // Signature section
  children.push(new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "d8d0c4", space: 1 } },
    spacing: { before: 300, after: 200 },
    children: []
  }));
  children.push(new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: "Renter Information & Signature", size: 28, bold: true })]
  }));

  const sigFields = [
    ["First Name", "Last Name"],
    ["Email Address"],
    ["Date of Birth", "Rental Date"],
    ["Signature"],
    ["Date Signed"]
  ];

  for (const row of sigFields) {
    for (const field of row) {
      children.push(new Paragraph({
        spacing: { after: 20 },
        children: [new TextRun({ text: field.toUpperCase(), size: 16, bold: true, color: "7a7269" })]
      }));
      children.push(new Paragraph({
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "d8d0c4", space: 1 } },
        spacing: { after: 200 },
        children: [new TextRun({ text: "" })]
      }));
    }
  }

  // Submit note
  children.push(new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text: "By signing, you confirm you have read this entire agreement, understand its terms, and agree to be bound by it.", size: 20, italics: true, color: "7a7269" })]
  }));

  // Footer
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 300 },
    children: [new TextRun({ text: footer, size: 16, color: "7a7269" })]
  }));

  return children;
}

function formatRuns(text) {
  // Parse **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map(part => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return new TextRun({ text: part.slice(2, -2), bold: true });
    }
    return new TextRun({ text: part });
  });
}

// ============================================================
// MOUNTAIN ISLAND LAKE
// ============================================================
const mountainIsland = {
  title: "Mountain Island Lake",
  location: "Mountain Island Lake \u00B7 Charlotte, NC",
  sections: [
    { num: "01", title: "The Vessel", content: [
      { type: 'p', text: 'You are renting a **GoBoat Double** \u2014 an inflatable, fully electric watercraft operated by Mozy Ventures LLC ("Mozy Outdoors"). The vessel is owned and insured by Mozy Ventures LLC and made available at this location through a partner agreement.' },
      { type: 'specs', items: [
        { label: "Max Occupancy", value: "2 persons" },
        { label: "Max Weight Capacity", value: "450 lbs" },
        { label: "Max Speed", value: "5 mph" },
        { label: "Motor", value: "Electric, 35 lb thrust" }
      ]}
    ]},
    { num: "02", title: "Rental Rules & Operator Policy", content: [
      { type: 'bullets', items: [
        '**Minimum rental age is 18.** You must be at least 18 years old to book and be the named renter on this agreement.',
        '**Operators aged 16\u201317** may operate a GoBoat only if an adult aged 21 or older is simultaneously renting a second GoBoat as part of the same booking and remains within visual range at all times.',
        '**No one under the age of 16** may operate this vessel under any circumstance.',
        '**Maximum 2 persons per vessel.** No exceptions. Do not exceed the 450 lb weight capacity.',
        '**Children under 13** must wear a properly fitted, U.S. Coast Guard-approved personal flotation device (PFD) at all times while the vessel is underway. PFDs are provided \u2014 their use is your responsibility.',
        '**No alcohol** may be consumed by the operator before or during operation.',
        'The vessel must remain within the designated operating area as briefed at check-in. Do not approach dams, spillways, commercial vessel channels, or restricted zones.',
        'The emergency shut-off lanyard must be attached to the operator\u2019s person at all times while underway.',
        '**Maximum rental duration is 4 hours.** Please return to dock before battery depletion.',
        'Return the vessel to the dock in the condition received. Report any damage immediately.'
      ]},
      { type: 'callout', text: 'This vessel is governed to 5 mph and is not capable of towing persons or watercraft. Do not attempt to tow anyone or anything.' }
    ]},
    { num: "03", title: "Battery Installation \u2014 Mountain Island Lake", content: [
      { type: 'p', text: 'At this location, the battery will be installed by your host prior to your departure. **Do not attempt to remove or reinstall the battery yourself.** If the battery appears improperly seated, is making unusual sounds, or the motor is not responding normally, do not operate the vessel \u2014 contact your host or Mozy Outdoors immediately.' },
      { type: 'p', text: 'Before departing, confirm:' },
      { type: 'bullets', items: [
        'Battery is fully seated and the connection is secure',
        'Motor responds to throttle at speed setting 1',
        'Emergency shut-off lanyard is attached and functional',
        'PFDs are on board and accessible'
      ]},
      { type: 'p', text: 'A short GoBoat walkthrough video is available on the Mozy start page and may also be posted at the dock. Watching it before your first rental is strongly encouraged.' }
    ]},
    { num: "04", title: "Assumption of Risk", content: [
      { type: 'p', text: 'I understand that operating a watercraft on open water involves inherent risks including but not limited to: adverse weather conditions, wakes from other vessels, submerged hazards, personal injury, and drowning. These risks exist even when all safety precautions are followed.' },
      { type: 'p', text: 'I voluntarily choose to participate in this activity and assume full responsibility for all risks associated with my use of the GoBoat and the waterway, known and unknown, including risks resulting from the actions or inactions of others on the water.' },
      { type: 'p', text: 'I acknowledge that the GoBoat Double is a 2-person inflatable watercraft designed for calm recreational use. I agree to operate it within its stated limitations and within my own skill and ability.' }
    ]},
    { num: "05", title: "Release of Liability", content: [
      { type: 'p', text: 'In consideration of being permitted to rent and operate a GoBoat watercraft through Mozy Ventures LLC, I, on behalf of myself and my heirs, executors, administrators, and assigns, hereby release, waive, discharge, and covenant not to sue **Mozy Ventures LLC**, its owners, officers, employees, agents, and partner property operators (collectively, "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury \u2014 including death \u2014 that may be sustained by me or any minor in my care, whether caused by the negligence of the Released Parties or otherwise, while participating in this rental activity or while on the premises of the rental location.' },
      { type: 'p', text: 'I agree that this release shall be binding upon me and my heirs, next of kin, executors, administrators, and assigns.' },
      { type: 'callout', text: 'If you are signing on behalf of a minor in your care, your signature below constitutes acceptance of these terms on behalf of that minor and yourself as their guardian.' }
    ]},
    { num: "06", title: "Indemnification", content: [
      { type: 'p', text: 'I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, cost, or expense \u2014 including reasonable attorney\u2019s fees \u2014 that they may incur due to my participation in this activity, whether caused by my negligence or otherwise, including any claims made by third parties arising from my use of the vessel.' }
    ]}
  ],
  acks: [
    'I have watched or will watch the GoBoat orientation video before departing. I understand basic vessel operation, how to attach the emergency lanyard, and how to safely return to dock.',
    'I confirm the boat\u2019s battery has been installed by the host and the vessel is ready to operate. I will not attempt to remove or reinstall the battery.',
    'I confirm that no more than **2 persons** will occupy this vessel at any time, and that total passenger weight will not exceed **450 lbs**.',
    'If any passenger in my party is under 13 years of age, I confirm they will wear a U.S. Coast Guard-approved PFD at all times while underway.',
    'I confirm that any operator of this vessel is at least **18 years old**, or is aged 16\u201317 with a 21+ adult simultaneously operating a second GoBoat as part of this booking.',
    'I have read and understand the Assumption of Risk, Release of Liability, and Indemnification sections above. I sign this agreement freely and voluntarily, without duress.'
  ],
  footer: "Mozy Ventures LLC \u00B7 mozyoutdoors.com \u00B7 (910) 216-0953 \u00B7 mozyoutdoors@gmail.com"
};

// ============================================================
// BELLS MARINA
// ============================================================
const bellsMarina = {
  title: "Bells Marina",
  location: "Bells Marina \u00B7 Eutawville, SC",
  sections: [
    { num: "01", title: "The Vessel", content: [
      { type: 'p', text: 'You are renting a **GoBoat** \u2014 an inflatable, fully electric watercraft operated by Mozy Ventures LLC ("Mozy Outdoors"). Bells Marina offers both the GoBoat Single (1-person) and GoBoat Double (2-person) depending on availability and your booking selection. The vessel is owned and insured by Mozy Ventures LLC and made available at this location through a partner agreement.' },
      { type: 'p', text: 'You are responsible for operating the vessel within the occupancy, weight, and speed limits of the specific model rented. These limits will be confirmed at check-in and are printed on the vessel.' }
    ]},
    { num: "02", title: "Rental Rules & Operator Policy", content: [
      { type: 'bullets', items: [
        '**Minimum rental age is 18.** You must be at least 18 years old to book and be the named renter on this agreement.',
        '**Operators aged 16\u201317** may operate a GoBoat only if an adult aged 21 or older is simultaneously renting a second GoBoat as part of the same booking and remains within visual range at all times.',
        '**No one under the age of 16** may operate this vessel under any circumstance.',
        '**Do not exceed the rated occupancy or weight capacity of your vessel.** These limits vary by model and are non-negotiable. Confirm your vessel\u2019s limits at check-in.',
        '**Children under 13** must wear a properly fitted, U.S. Coast Guard-approved personal flotation device (PFD) at all times while the vessel is underway. PFDs are provided \u2014 their use is your responsibility.',
        '**No alcohol** may be consumed by the operator before or during operation.',
        'The vessel must remain within the designated operating area as briefed at check-in. Do not approach dams, spillways, commercial vessel channels, or restricted zones.',
        'The emergency shut-off lanyard must be attached to the operator\u2019s person at all times while underway.',
        '**Maximum rental duration is 4 hours.** Please return to dock before battery depletion.',
        'Return the vessel to the dock in the condition received. Report any damage immediately.'
      ]},
      { type: 'callout', text: 'This vessel is governed to 5 mph and is not capable of towing persons or watercraft. Do not attempt to tow anyone or anything.' }
    ]},
    { num: "03", title: "Battery Installation \u2014 Bells Marina", content: [
      { type: 'p', text: 'At this location, the battery will be installed by your host prior to your departure. **Do not attempt to remove or reinstall the battery yourself.** If the battery appears improperly seated, is making unusual sounds, or the motor is not responding normally, do not operate the vessel \u2014 contact your host or Mozy Outdoors immediately.' },
      { type: 'p', text: 'Before departing, confirm:' },
      { type: 'bullets', items: [
        'Battery is fully seated and the connection is secure',
        'Motor responds to throttle at speed setting 1',
        'Emergency shut-off lanyard is attached and functional',
        'PFDs are on board and accessible'
      ]},
      { type: 'p', text: 'A short GoBoat walkthrough video is available on the Mozy start page and may also be posted at the dock. Watching it before your first rental is strongly encouraged.' }
    ]},
    { num: "04", title: "Assumption of Risk", content: [
      { type: 'p', text: 'I understand that operating a watercraft on open water involves inherent risks including but not limited to: adverse weather conditions, wakes from other vessels, submerged hazards, personal injury, and drowning. These risks exist even when all safety precautions are followed.' },
      { type: 'p', text: 'I acknowledge that Lake Marion and the surrounding waterways are home to **alligators and other wildlife**. I agree to remain in the vessel at all times while on the water, keep hands and feet inside the boat, and avoid approaching or disturbing wildlife.' },
      { type: 'p', text: 'I voluntarily choose to participate in this activity and assume full responsibility for all risks associated with my use of the GoBoat and the waterway, known and unknown, including risks resulting from the actions or inactions of others on the water.' },
      { type: 'p', text: 'I acknowledge that the GoBoat is an inflatable watercraft designed for calm recreational use. I agree to operate it within the stated limitations of the specific model rented and within my own skill and ability.' }
    ]},
    { num: "05", title: "Release of Liability", content: [
      { type: 'p', text: 'In consideration of being permitted to rent and operate a GoBoat watercraft through Mozy Ventures LLC, I, on behalf of myself and my heirs, executors, administrators, and assigns, hereby release, waive, discharge, and covenant not to sue **Mozy Ventures LLC**, its owners, officers, employees, agents, and partner property operators (collectively, "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury \u2014 including death \u2014 that may be sustained by me or any minor in my care, whether caused by the negligence of the Released Parties or otherwise, while participating in this rental activity or while on the premises of the rental location.' },
      { type: 'p', text: 'I agree that this release shall be binding upon me and my heirs, next of kin, executors, administrators, and assigns.' },
      { type: 'callout', text: 'If you are signing on behalf of a minor in your care, your signature below constitutes acceptance of these terms on behalf of that minor and yourself as their guardian.' }
    ]},
    { num: "06", title: "Indemnification", content: [
      { type: 'p', text: 'I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, cost, or expense \u2014 including reasonable attorney\u2019s fees \u2014 that they may incur due to my participation in this activity, whether caused by my negligence or otherwise, including any claims made by third parties arising from my use of the vessel.' }
    ]}
  ],
  acks: [
    'I have watched or will watch the GoBoat orientation video before departing. I understand basic vessel operation, how to attach the emergency lanyard, and how to safely return to dock.',
    'I confirm the boat\u2019s battery has been installed by the host and the vessel is ready to operate. I will not attempt to remove or reinstall the battery.',
    'I confirm that I will not exceed the **rated occupancy or weight capacity** of the vessel I am renting. I understand these limits vary by model and will be confirmed at check-in.',
    'If any passenger in my party is under 13 years of age, I confirm they will wear a U.S. Coast Guard-approved PFD at all times while underway.',
    'I confirm that any operator of this vessel is at least **18 years old**, or is aged 16\u201317 with a 21+ adult simultaneously operating a second GoBoat as part of this booking.',
    'I have read and understand the Assumption of Risk, Release of Liability, and Indemnification sections above. I sign this agreement freely and voluntarily, without duress.'
  ],
  footer: "Mozy Ventures LLC \u00B7 mozyoutdoors.com \u00B7 (910) 216-0953 \u00B7 mozyoutdoors@gmail.com"
};

// ============================================================
// CAPE FEAR REGION
// ============================================================
const capeFear = {
  title: "Cape Fear Region",
  location: "Cape Fear Region \u00B7 New Hanover County, NC",
  sections: [
    { num: "01", title: "The Vessel", content: [
      { type: 'p', text: 'You are renting a **GoBoat** \u2014 an inflatable, fully electric watercraft owned, insured, and operated by Mozy Ventures LLC ("Mozy Outdoors"). Mozy Outdoors offers both the GoBoat Single (1-person) and GoBoat Double (2-person) depending on availability and your booking selection.' },
      { type: 'p', text: 'You are responsible for operating the vessel within the occupancy, weight, and speed limits of the specific model rented. These limits will be confirmed at check-in and are printed on the vessel.' }
    ]},
    { num: "02", title: "Rental Rules & Operator Policy", content: [
      { type: 'bullets', items: [
        '**Minimum rental age is 18.** You must be at least 18 years old to book and be the named renter on this agreement.',
        '**Operators aged 16\u201317** may operate a GoBoat only if an adult aged 21 or older is simultaneously renting a second GoBoat as part of the same booking and remains within visual range at all times.',
        '**No one under the age of 16** may operate this vessel under any circumstance.',
        '**Do not exceed the rated occupancy or weight capacity of your vessel.** These limits vary by model and are non-negotiable. Confirm your vessel\u2019s limits at check-in.',
        '**Children under 13** must wear a properly fitted, U.S. Coast Guard-approved personal flotation device (PFD) at all times while the vessel is underway. PFDs are provided \u2014 their use is your responsibility.',
        '**No alcohol** may be consumed by the operator before or during operation.',
        'The vessel must remain within the designated operating area as briefed at check-in. Do not approach dams, spillways, commercial vessel channels, or restricted zones.',
        'The emergency shut-off lanyard must be attached to the operator\u2019s person at all times while underway.',
        '**Maximum rental duration is 4 hours.** Please return to dock before battery depletion.',
        'Return the vessel to the dock in the condition received. Report any damage immediately.'
      ]},
      { type: 'callout', text: 'This vessel is governed to 5 mph and is not capable of towing persons or watercraft. Do not attempt to tow anyone or anything.' }
    ]},
    { num: "03", title: "Battery Installation \u2014 Cape Fear Region", content: [
      { type: 'p', text: 'The battery will be installed by Mozy Outdoors staff prior to your departure. **Do not attempt to remove or reinstall the battery yourself.** If the battery appears improperly seated, is making unusual sounds, or the motor is not responding normally, do not operate the vessel \u2014 notify Mozy Outdoors staff immediately.' },
      { type: 'p', text: 'Before departing, confirm:' },
      { type: 'bullets', items: [
        'Battery is fully seated and the connection is secure',
        'Motor responds to throttle at speed setting 1',
        'Emergency shut-off lanyard is attached and functional',
        'PFDs are on board and accessible'
      ]},
      { type: 'p', text: 'A short GoBoat walkthrough video is available on the Mozy start page and may also be posted at the dock. Watching it before your first rental is strongly encouraged.' }
    ]},
    { num: "04", title: "Assumption of Risk", content: [
      { type: 'p', text: 'I understand that operating a watercraft on open water involves inherent risks including but not limited to: adverse weather conditions, wakes from other vessels, submerged hazards, personal injury, and drowning. These risks exist even when all safety precautions are followed.' },
      { type: 'p', text: 'I acknowledge that the Cape Fear River, basin, and surrounding inland waterways may have **commercial and recreational boat traffic** that can produce significant wakes and wash. I agree to maintain awareness of other vessels, avoid shipping channels and restricted areas, and brace for wakes when necessary.' },
      { type: 'p', text: 'I acknowledge that these waterways may contain **oyster beds and submerged shell deposits** that can cause cuts to skin or puncture an inflatable vessel if grounded. I agree to avoid shallow areas, follow the designated operating zone, and remain alert to water depth.' },
      { type: 'p', text: 'I voluntarily choose to participate in this activity and assume full responsibility for all risks associated with my use of the GoBoat and the waterway, known and unknown, including risks resulting from the actions or inactions of others on the water.' },
      { type: 'p', text: 'I acknowledge that the GoBoat is an inflatable watercraft designed for calm recreational use. I agree to operate it within the stated limitations of the specific model rented and within my own skill and ability.' }
    ]},
    { num: "05", title: "Release of Liability", content: [
      { type: 'p', text: 'In consideration of being permitted to rent and operate a GoBoat watercraft through Mozy Ventures LLC, I, on behalf of myself and my heirs, executors, administrators, and assigns, hereby release, waive, discharge, and covenant not to sue **Mozy Ventures LLC**, its owners, officers, employees, agents, and partner property operators (collectively, "Released Parties") from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury \u2014 including death \u2014 that may be sustained by me or any minor in my care, whether caused by the negligence of the Released Parties or otherwise, while participating in this rental activity or while on the premises of the rental location.' },
      { type: 'p', text: 'I agree that this release shall be binding upon me and my heirs, next of kin, executors, administrators, and assigns.' },
      { type: 'callout', text: 'If you are signing on behalf of a minor in your care, your signature below constitutes acceptance of these terms on behalf of that minor and yourself as their guardian.' }
    ]},
    { num: "06", title: "Indemnification", content: [
      { type: 'p', text: 'I agree to indemnify and hold harmless the Released Parties from any loss, liability, damage, cost, or expense \u2014 including reasonable attorney\u2019s fees \u2014 that they may incur due to my participation in this activity, whether caused by my negligence or otherwise, including any claims made by third parties arising from my use of the vessel.' }
    ]}
  ],
  acks: [
    'I have watched or will watch the GoBoat orientation video before departing. I understand basic vessel operation, how to attach the emergency lanyard, and how to safely return to dock.',
    'I confirm the boat\u2019s battery has been installed by Mozy Outdoors staff and the vessel is ready to operate. I will not attempt to remove or reinstall the battery.',
    'I confirm that I will not exceed the **rated occupancy or weight capacity** of the vessel I am renting. I understand these limits vary by model and will be confirmed at check-in.',
    'If any passenger in my party is under 13 years of age, I confirm they will wear a U.S. Coast Guard-approved PFD at all times while underway.',
    'I confirm that any operator of this vessel is at least **18 years old**, or is aged 16\u201317 with a 21+ adult simultaneously operating a second GoBoat as part of this booking.',
    'I have read and understand the Assumption of Risk, Release of Liability, and Indemnification sections above. I sign this agreement freely and voluntarily, without duress.'
  ],
  footer: "Mozy Ventures LLC \u00B7 mozyoutdoors.com \u00B7 (910) 216-0953 \u00B7 mozyoutdoors@gmail.com"
};

// ============================================================
// GENERATE
// ============================================================
async function generate() {
  const dir = __dirname;
  const waivers = [
    { config: mountainIsland, filename: 'Mountain-Island-Lake-Waiver.docx' },
    { config: bellsMarina, filename: 'Bells-Marina-Waiver.docx' },
    { config: capeFear, filename: 'Cape-Fear-Waiver.docx' },
  ];

  for (const { config, filename } of waivers) {
    const doc = makeWaiver(config);
    const buffer = await Packer.toBuffer(doc);
    const path = dir + '/' + filename;
    fs.writeFileSync(path, buffer);
    console.log('Created: ' + path);
  }
}

generate().catch(e => { console.error(e); process.exit(1); });
