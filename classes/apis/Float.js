const { config } = require("dotenv");
config();

/**
 * The Float class lets you interact with the Float API.
 */
class Float {
  constructor() {
    this.baseUrl = "https://api.float.com/v3";
    this.apiKey = process.env.FLOAT_API_KEY;
    this.defaultHeaders = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    };
  }

  async getPeopleReport() {
    /**
     * The start and end dates are now hardcoded, it would be nice to make
     * these dynamic in the intention handler based on the user's question.
     */
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 7);

    const formattedStartDate = startDate.toISOString().split("T")[0];
    const formattedEndDate = endDate.toISOString().split("T")[0];

    const url = `${this.baseUrl}/reports/people?start_date=${formattedStartDate}&end_date=${formattedEndDate}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }

  async getPeople() {
    const url = `${this.baseUrl}/people`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }

  async fetchTasksByPersonId(personId, startDate, endDate) {
    const today = new Date();
    today.setDate(today.getDate());

    const formatDate = (date) => date.toISOString().split("T")[0];
    const formattedDate = formatDate(today);

    if (!startDate) {
      startDate = formattedDate;
    }

    if (!endDate) {
      endDate = formattedDate;
    }

    const fields = [
      "id",
      "name",
      "hours",
      "project_id",
      "task_id",
      "start_date",
      "end_date",
    ];

    const queryParams = new URLSearchParams({
      people_id: personId,
      start_date: startDate,
      end_date: endDate,
      billable: 1,
      repeat_state: 0,
    });

    queryParams.set("fields", fields.join(","));

    const url = `${this.baseUrl}/tasks?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return await response.json();
  }

  async getProjectById(projectId) {
    const fields = ["name", "project_manager"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${
      this.baseUrl
    }/projects/${projectId}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }

  async getTaskById(taskId) {
    const fields = ["name", "project_id", "tasklist_id"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${this.baseUrl}/tasks/${taskId}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }

  async getAccountById(personId) {
    const fields = ["name", "email"];

    const queryParams = new URLSearchParams({
      fields: fields.join(","),
    });

    const url = `${
      this.baseUrl
    }/accounts/${personId}?${queryParams.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.defaultHeaders,
    });

    return response.json();
  }
}

module.exports = new Float();
